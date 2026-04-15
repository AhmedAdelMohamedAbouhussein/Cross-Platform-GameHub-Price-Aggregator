import { exchangeAccessCodeForAuthTokens, exchangeNpssoForAccessCode, getProfileFromUserName } from "psn-api";
import { getAllOwnedGames, getFriendList } from "../allPSNInfo.js";
import userModel from "../../models/User.js";

export const PSNloginWithNpsso = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: "User not authenticated" });

        const { npsso } = req.body;
        if (!npsso) return res.status(400).json({ error: "NPSSO missing" });

        // Exchange NPSSO for access code
        const accessCode = await exchangeNpssoForAccessCode(npsso);
        const authorization = await exchangeAccessCodeForAuthTokens(accessCode);

        const PSNRefreshToken = authorization.refreshToken;
        const PSNTokenExpiresAt = new Date(Date.now() + (authorization.refreshTokenExpiresIn * 1000) - (24 * 60 * 60 * 1000));

        const profileResponse = await getProfileFromUserName(authorization, "me");
        const PSNId = profileResponse.profile.onlineId;

        // 1. Update Linked Accounts
        const dbUser = await userModel.findById(userId);
        if (!dbUser) return res.status(404).json({ error: "User not found" });

        let linkedAccounts = dbUser.linkedAccounts || new Map();
        let psnAccounts = linkedAccounts.get("PSN") || [];

        const existingAccIndex = psnAccounts.findIndex(acc => acc.accountId === PSNId);
        const accountData = {
            accountId: PSNId,
            displayName: PSNId,
            refreshToken: PSNRefreshToken,
            expiresAt: PSNTokenExpiresAt,
            lastSync: new Date(),
            avatar: profileResponse.profile.avatarUrls[0].avatarUrl
        };

        if (existingAccIndex > -1) {
            psnAccounts[existingAccIndex] = accountData;
        } else {
            psnAccounts.push(accountData);
        }
        linkedAccounts.set("PSN", psnAccounts);
        dbUser.linkedAccounts = linkedAccounts;

        // 2. Update Friends
        const friends = await getFriendList(authorization);
        if (!dbUser.friends) dbUser.friends = new Map();

        let currentPsnFriends = dbUser.friends.get("PSN") || [];
        currentPsnFriends = currentPsnFriends.filter(f => f.linkedAccountId !== PSNId);

        const newFriends = friends.map(f => ({
            ...f,
            linkedAccountId: PSNId,
            status: "accepted",
            source: "PSN"
        }));
        dbUser.friends.set("PSN", [...currentPsnFriends, ...newFriends]);

        // 3. Update Owned Games
        const games = await getAllOwnedGames(authorization);
        if (!dbUser.ownedGames) dbUser.ownedGames = new Map();
        let psnGamesMap = dbUser.ownedGames.get("PSN") || new Map();

        for (const game of games) {
            if (!game || !game.gameId) continue;

            const gameId = String(game.gameId);

            let existingGame = psnGamesMap.get(gameId);
            const ownerRecord = {
                accountId: PSNId,
                accountName: PSNId,
                hoursPlayed: game.hoursPlayed,
                lastPlayed: game.lastPlayed,
                progress: game.progress || 0,
                achievements: game.achievements || []
            };

            if (existingGame) {
                const existingOwnerIndex = existingGame.owners.findIndex(o => o.accountId === PSNId);
                if (existingOwnerIndex > -1) {
                    existingGame.owners[existingOwnerIndex] = ownerRecord;
                } else {
                    existingGame.owners.push(ownerRecord);
                }
                existingGame.maxProgress = Math.max(...existingGame.owners.map(o => o.progress || 0));
            } else {
                psnGamesMap.set(gameId, {
                    gameName: game.gameName,
                    gameId: game.gameId,
                    platform: game.platform,
                    coverImage: game.coverImage,
                    owners: [ownerRecord],
                    maxProgress: ownerRecord.progress,
                    totalHours: ownerRecord.hoursPlayed
                });
            }
        }
        dbUser.ownedGames.set("PSN", psnGamesMap);

        await dbUser.save();

        console.log("PSN multi-account sync completed for user:", userId);
        res.status(200).json({ message: "PSN synced successfully" });
    }
    catch (error) {
        console.error("PSN sync error:", error);
        const err = new Error("PSN login failed. Ensure NPSSO is valid.");
        next(err);
    }
};
