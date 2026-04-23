import cron from 'node-cron';
import User from '../models/User.js';
import axios from 'axios';
import config from '../config/env.js';
import Notification from '../models/Notification.js';

const ITAD_API_KEY = config.iTAD.apiKey;

/**
 * Runs every day at midnight (00:00)
 * Checks all user wishlists for price drops and sends notifications.
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

            // 3. Batch fetch prices (ITAD supports up to 100 per call usually, we'll do chunks of 50)
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

                    // Check each tracked store for this game
                    item.storePrices.forEach(storeTracking => {
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
                            // Update lastNotifiedPrice
                            storeTracking.lastNotifiedPrice = currentPrice;
                            userUpdated = true;
                        }
                    });

                    // If any stores dropped in price, notify the user
                    if (storePriceDrops.length > 0) {
                        const dropDetails = storePriceDrops.map(d => `${d.storeName} ($${d.newPrice}, was $${d.oldPrice})`).join(", ");

                        await Notification.create({
                            recipient: user._id,
                            message: `Price drop alert for ${item.gameName}! Now cheaper on: ${dropDetails}`,
                            link: `/games/${item.gameId}`,
                            type: 'price_drop'
                        });
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
