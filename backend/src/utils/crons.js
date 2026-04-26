import cron from 'node-cron';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import axios from 'axios';
import config from '../config/env.js';
import Notification from '../models/Notification.js';
import { generatePriceDropEmail, generateAccountPurgedEmail, generateAdminReportEmail, generateTokenExpiredEmail } from './emailTemplates.js';
import { exchangeRefreshTokenForAuthTokens } from 'psn-api';
import { isOAuthAuthFailure, needsRenewal } from './oauthHelpers.js';

const ITAD_API_KEY = config.iTAD.apiKey;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    secure: true,
    auth: {
        user: config.gmail.gmail,
        pass: config.gmail.password,
    },
});

/**
 * Runs every day at 08:00 AM
 * Generates an admin report with platform metrics and emails it to the admin.
 */
export const startAdminReportCron = () => {
    // 0 8 * * * = 8:00 AM every day
    cron.schedule('0 8 * * *', async () => {
        console.log('[Cron] Starting Daily Admin Report generation...');
        try {
            const totalUsers = await User.countDocuments();
            const activeUsers = await User.countDocuments({ isDeleted: false });
            const deletedUsers = await User.countDocuments({ isDeleted: true });
            const verifiedUsers = await User.countDocuments({ isVerified: true });

            const steamUsers = await User.countDocuments({ 'steam.id': { $exists: true } });
            const epicUsers = await User.countDocuments({ 'epic.id': { $exists: true } });
            const psnUsers = await User.countDocuments({ 'psn.id': { $exists: true } });
            const xboxUsers = await User.countDocuments({ 'xbox.id': { $exists: true } });

            const metrics = {
                totalUsers,
                activeUsers,
                deletedUsers,
                verifiedUsers,
                steamUsers,
                epicUsers,
                psnUsers,
                xboxUsers
            };

            const targetEmail = config.personalEmail;

            await transporter.sendMail({
                from: `"GameHub Admin" <${config.gmail.gmail}>`,
                to: targetEmail,
                subject: "📊 Daily System Report - GameHub",
                html: generateAdminReportEmail(metrics)
            });

            console.log(`[Cron] Admin Report sent successfully to ${targetEmail}.`);
        } catch (error) {
            console.error('[Cron] Admin Report cron error:', error.message);
        }
    });
};

/**
 * Runs every day at midnight (00:00)
 * Checks all user wishlists for price drops, creates in-app notifications, and sends email alerts.
 */
export const startWishlistCron = () => {
    // 0 0 * * * = Midnight every day
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Starting daily wishlist price check...');

        if (!ITAD_API_KEY) {
            console.error('[Cron] ITAD API Key missing, skipping price check.');
            return;
        }

        try {
            // 1. Get all users with non-empty wishlists
            const users = await User.find({ 'wishlist.0': { $exists: true } });

            // 2. Collect all unique ITAD IDs
            const allItadIds = new Set();
            users.forEach(u => u.wishlist.forEach(item => {
                if (item.itadId) allItadIds.add(item.itadId);
            }));

            const itadIdArray = Array.from(allItadIds);
            const priceMap = {};

            // 3. Batch fetch prices in chunks of 50
            const chunkSize = 50;
            for (let i = 0; i < itadIdArray.length; i += chunkSize) {
                const chunk = itadIdArray.slice(i, i + chunkSize);
                try {
                    const res = await axios.post("https://api.isthereanydeal.com/games/prices/v3", chunk, {
                        params: { key: ITAD_API_KEY, country: "US" }
                    });
                    res.data.forEach(gamePrice => {
                        priceMap[gamePrice.id] = gamePrice.deals || [];
                    });
                } catch (err) {
                    console.error(`[Cron] Batch price fetch failed for chunk starting at ${i}:`, err.message);
                }
            }

            // 4. Process each user and their wishlist
            for (const user of users) {
                let userUpdated = false;

                for (const item of user.wishlist) {
                    if (!item.itadId || !priceMap[item.itadId]) continue;

                    const currentDeals = priceMap[item.itadId];
                    const storePriceDrops = [];

                    // Check each tracked store for this game (only stores in targetStores)
                    item.storePrices.forEach(storeTracking => {
                        // Skip if this store isn't in the user's tracked stores list
                        if (item.targetStores?.length > 0 && !item.targetStores.includes(storeTracking.storeName)) return;

                        const deal = currentDeals.find(d => d.shop?.name === storeTracking.storeName);
                        if (!deal) return;

                        const currentPrice = deal.price?.amount;
                        const baseline = storeTracking.lastNotifiedPrice || storeTracking.initialPrice;

                        if (currentPrice && baseline && currentPrice < baseline) {
                            storePriceDrops.push({
                                storeName: storeTracking.storeName,
                                oldPrice: baseline,
                                newPrice: currentPrice
                            });
                            storeTracking.lastNotifiedPrice = currentPrice;
                            userUpdated = true;
                        }
                    });

                    // If any stores dropped in price — notify in-app AND send email
                    if (storePriceDrops.length > 0) {
                        const dropDetails = storePriceDrops.map(d => `${d.storeName} ($${d.newPrice}, was $${d.oldPrice})`).join(", ");

                        // In-app notification
                        await Notification.create({
                            recipient: user._id,
                            sender: 'system',
                            message: `Price drop alert for ${item.gameName}! Now cheaper on: ${dropDetails}`,
                            link: `/games/${item.gameId}`,
                            type: 'deal_alert'
                        });

                        // Email notification
                        try {
                            await transporter.sendMail({
                                from: `"GameHub Deals" <${config.gmail.gmail}>`,
                                to: user.email,
                                subject: `💸 Price Drop: ${item.gameName} is cheaper now!`,
                                html: generatePriceDropEmail(user.name, item.gameName, item.gameId, storePriceDrops)
                            });
                        } catch (mailErr) {
                            console.error(`[Cron] Failed to send price-drop email to ${user.email}:`, mailErr.message);
                        }

                        console.log(`[Cron] Notified ${user.email} about price drops for ${item.gameName}`);
                    }
                }

                if (userUpdated) {
                    await user.save();
                }
            }
            console.log('[Cron] Daily wishlist price check completed.');
        } catch (error) {
            console.error('[Cron] Wishlist cron error:', error.message);
        }
    });
};

/**
 * Runs every day at 01:00
 * Permanently deletes accounts that have been soft-deleted for more than 30 days and emails the user.
 */
export const startPurgeCron = () => {
    // 0 1 * * * = 1:00 AM every day
    cron.schedule('0 1 * * *', async () => {
        console.log('[Cron] Starting 30-day soft-delete purge check...');
        try {
            const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            const staleUsers = await User.find({
                isDeleted: true,
                deletedAt: { $lte: cutoff }
            });

            console.log(`[Cron] Found ${staleUsers.length} account(s) to permanently purge.`);

            for (const user of staleUsers) {
                // Send farewell email BEFORE deleting (so we still have email/name)
                try {
                    await transporter.sendMail({
                        from: `"GameHub" <${config.gmail.gmail}>`,
                        to: user.email,
                        subject: "Your GameHub account has been permanently deleted",
                        html: generateAccountPurgedEmail(user.name)
                    });
                } catch (mailErr) {
                    console.error(`[Cron] Failed to send purge email to ${user.email}:`, mailErr.message);
                }

                // Use document.deleteOne() to trigger the friends-cleanup pre-hook
                await user.deleteOne();
                console.log(`[Cron] Permanently purged user: ${user.publicID}`);
            }

            console.log('[Cron] 30-day purge completed.');
        } catch (error) {
            console.error('[Cron] Purge cron error:', error.message);
        }
    });
};

// ── Helper: small delay to be polite to OAuth servers ─────────────────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Runs every day at 03:00 AM.
 * Silently rotates PSN and Xbox refresh tokens before they expire.
 * PSN tokens last ~60 days — we renew when within 20 days of expiry.
 * Xbox tokens last ~90 days — we renew when within 25 days of expiry.
 * On auth failure (invalid_grant / changed password), marks the account
 * tokenStatus: 'invalid', creates an in-app notification, and emails the user.
 * Sequential processing with 150ms gaps between OAuth calls avoids rate limits.
 */
export const startTokenRefreshCron = () => {
    // 0 3 * * * = 3:00 AM every day
    cron.schedule('0 3 * * *', async () => {
        console.log('[Cron:TokenRefresh] Starting proactive token rotation...');

        const APP_URL = config.appFrontendUrl || 'http://localhost:5173';
        const CLIENT_ID = config.azure.clientId;
        const CLIENT_SECRET = config.azure.clientSecret;
        const REDIRECT_URI = config.xboxRedirectURL;

        try {
            // Find all non-deleted users that have PSN or Xbox linked accounts
            const users = await User.find({
                isDeleted: false,
                $or: [
                    { 'linkedAccounts.PSN': { $exists: true } },
                    { 'linkedAccounts.Xbox': { $exists: true } }
                ]
            }).select('+linkedAccounts');

            console.log(`[Cron:TokenRefresh] Found ${users.length} user(s) with PSN/Xbox accounts.`);

            for (const user of users) {
                const linkedAccounts = user.linkedAccounts || new Map();
                let userModified = false;

                // ── PSN ──────────────────────────────────────────────────────
                const psnAccounts = linkedAccounts.get('PSN') || [];
                for (let i = 0; i < psnAccounts.length; i++) {
                    const account = psnAccounts[i];
                    if (!account.refreshToken) continue;

                    // PSN ~60 day lifetime — renew when within 20 days
                    if (!needsRenewal(account.expiresAt, 20)) {
                        console.log(`[Cron:TokenRefresh] PSN ${account.accountId} — token OK, skipping.`);
                        continue;
                    }

                    console.log(`[Cron:TokenRefresh] Renewing PSN token for ${account.accountId}...`);
                    try {
                        const updatedAuth = await exchangeRefreshTokenForAuthTokens(account.refreshToken);

                        // psn-api sometimes omits a new refreshToken — keep old one if so
                        if (updatedAuth.refreshToken) {
                            account.refreshToken = updatedAuth.refreshToken;
                        }

                        // Use refreshTokenExpiresIn if available, otherwise default to 55 days
                        const expiresInSec = updatedAuth.refreshTokenExpiresIn || (55 * 24 * 60 * 60);
                        account.expiresAt = new Date(Date.now() + (expiresInSec * 1000) - (24 * 60 * 60 * 1000));
                        account.tokenStatus = 'active';
                        account.lastSync = new Date();
                        userModified = true;
                        console.log(`[Cron:TokenRefresh] PSN ${account.accountId} — renewed. Expires: ${account.expiresAt}`);
                    } catch (err) {
                        if (isOAuthAuthFailure(err)) {
                            console.warn(`[Cron:TokenRefresh] PSN ${account.accountId} — auth failure, marking invalid.`);
                            account.tokenStatus = 'invalid';
                            userModified = true;

                            try {
                                await Notification.create({
                                    recipient: user._id,
                                    sender: 'system',
                                    type: 'token_expired',
                                    message: 'Your PlayStation session has expired. Re-sync to keep your library up to date.',
                                    link: '/library/sync/psn'
                                });
                            } catch (notifErr) {
                                console.error(`[Cron:TokenRefresh] PSN notification failed for ${user.publicID}:`, notifErr.message);
                            }

                            try {
                                await transporter.sendMail({
                                    from: `"GameHub" <${config.gmail.gmail}>`,
                                    to: user.email,
                                    subject: '⚠️ Your PlayStation session has expired — Re-sync required',
                                    html: generateTokenExpiredEmail(user.name, 'PSN', `${APP_URL}/library/sync/psn`)
                                });
                            } catch (mailErr) {
                                console.error(`[Cron:TokenRefresh] PSN expiry email failed for ${user.email}:`, mailErr.message);
                            }
                        } else {
                            // Transient error (network, timeout) — don't invalidate the token
                            console.error(`[Cron:TokenRefresh] PSN ${account.accountId} — transient error:`, err.message);
                        }
                    }

                    await sleep(150); // Be polite to Sony's OAuth servers
                }

                // ── Xbox ─────────────────────────────────────────────────────
                const xboxAccounts = linkedAccounts.get('Xbox') || [];
                for (let i = 0; i < xboxAccounts.length; i++) {
                    const account = xboxAccounts[i];
                    if (!account.refreshToken) continue;

                    // Xbox ~90 day lifetime — renew when within 25 days
                    if (!needsRenewal(account.expiresAt, 25)) {
                        console.log(`[Cron:TokenRefresh] Xbox ${account.accountId} — token OK, skipping.`);
                        continue;
                    }

                    console.log(`[Cron:TokenRefresh] Renewing Xbox token for ${account.accountId}...`);
                    try {
                        const tokenRes = await axios.post(
                            'https://login.live.com/oauth20_token.srf',
                            new URLSearchParams({
                                client_id: CLIENT_ID,
                                client_secret: CLIENT_SECRET,
                                grant_type: 'refresh_token',
                                refresh_token: account.refreshToken,
                                redirect_uri: REDIRECT_URI,
                            }),
                            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                        );

                        account.refreshToken = tokenRes.data.refresh_token;
                        // Microsoft's refresh_token lasts 90 days on server apps
                        account.expiresAt = new Date(Date.now() + (90 * 24 * 60 * 60 * 1000) - (24 * 60 * 60 * 1000));
                        account.tokenStatus = 'active';
                        account.lastSync = new Date();
                        userModified = true;
                        console.log(`[Cron:TokenRefresh] Xbox ${account.accountId} — token renewed.`);
                    } catch (err) {
                        if (isOAuthAuthFailure(err)) {
                            console.warn(`[Cron:TokenRefresh] Xbox ${account.accountId} — auth failure, marking invalid.`);
                            account.tokenStatus = 'invalid';
                            userModified = true;

                            try {
                                await Notification.create({
                                    recipient: user._id,
                                    sender: 'system',
                                    type: 'token_expired',
                                    message: 'Your Xbox session has expired. Re-sync to keep your library up to date.',
                                    link: '/library/sync/xbox'
                                });
                            } catch (notifErr) {
                                console.error(`[Cron:TokenRefresh] Xbox notification failed for ${user.publicID}:`, notifErr.message);
                            }

                            try {
                                await transporter.sendMail({
                                    from: `"GameHub" <${config.gmail.gmail}>`,
                                    to: user.email,
                                    subject: '⚠️ Your Xbox session has expired — Re-sync required',
                                    html: generateTokenExpiredEmail(user.name, 'Xbox', `${APP_URL}/library/sync/xbox`)
                                });
                            } catch (mailErr) {
                                console.error(`[Cron:TokenRefresh] Xbox expiry email failed for ${user.email}:`, mailErr.message);
                            }
                        } else {
                            console.error(`[Cron:TokenRefresh] Xbox ${account.accountId} — transient error:`, err.message);
                        }
                    }

                    await sleep(150); // Be polite to Microsoft's OAuth servers
                }

                if (userModified) {
                    user.markModified('linkedAccounts');
                    await user.save();
                }
            }

            console.log('[Cron:TokenRefresh] Token rotation complete.');
        } catch (error) {
            console.error('[Cron:TokenRefresh] Fatal cron error:', error.message);
        }
    });
};
