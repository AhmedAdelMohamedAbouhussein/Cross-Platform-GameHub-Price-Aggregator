import cron from 'node-cron';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import axios from 'axios';
import config from '../config/env.js';
import Notification from '../models/Notification.js';
import { generatePriceDropEmail, generateAccountPurgedEmail } from './emailTemplates.js';

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
