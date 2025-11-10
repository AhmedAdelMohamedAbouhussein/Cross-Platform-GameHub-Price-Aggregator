import userModel from "../models/User.js";

import { getOwnedGames, getUserAchievements } from "./allSteamInfo.js";

export const refreshOwnedGames = async (req, res, next) => 
    {
    try 
    {   
        const userId = req.body.userId;
        const user = await userModel.findById(userId);
        if (!user)
        {
            return res.status(404).json({ message: "User not found" });
        }

        if (req.body.steamId) 
        {
            const steamId = req.body.steamId;

            // Await async functions
            const ownedGames = await getOwnedGames(userId, steamId);
            const gamesWithAchievements = await getUserAchievements(steamId, ownedGames);

            const updateData = {};
            for (const game of gamesWithAchievements) {
                // Set/update the game under the platform map
                updateData[`ownedGames.${game.platform}.${game.gameId}`] = game;
            }

            await userModel.updateOne(
                { _id: userId },
                { $set: { ...updateData, steamId } },
            ); 
        }

        return res.status(200).json({ message: "Owned games refreshed successfully" });
    } catch (err) {
        const error = new Error('Failed to refresh owned games');
        next(error);
    }
}
