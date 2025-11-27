import { exchangeAccessCodeForAuthTokens, exchangeNpssoForAccessCode, getProfileFromUserName } from "psn-api";
import { getAllOwnedGames, getFriendList } from "../allPSNInfo.js";
import userModel from "../../models/User.js";

export const PSNloginWithNpsso = async (req, res) => 
{
    try 
    {
        const userId = req.session.userId;
        console.log("PSN sync started for user:", userId);

        if(!userId) return res.status(401).json({ error: "User not authenticated" });

        const { npsso } = req.body;
        if (!npsso) return res.status(400).json({ error: "NPSSO missing" });

        // Exchange NPSSO for access code
        const accessCode = await exchangeNpssoForAccessCode(npsso);
        const authorization = await exchangeAccessCodeForAuthTokens(accessCode);

        const PSNRefreshToken = authorization.refreshToken;
        const PSNTokenExpiresAt = new Date( Date.now() + (authorization.refreshTokenExpiresIn * 1000) - (24 * 60 * 60 * 1000));

        const response = await getProfileFromUserName(authorization, "me");
        const PSNId = response.profile.onlineId;

        const friends = await getFriendList(authorization);
        console.log("2");
        await userModel.updateOne
        (
            { _id: userId },
            {
                $set: 
                {
                    "friends.PSN": friends,
                },
                PSNId, PSNRefreshToken, PSNTokenExpiresAt 
            },
        );

        const games = await getAllOwnedGames(authorization);
        console.log("3");

        const updateData = {};
        
        for (const game of games) 
        {
            if (!game || !game.gameId) continue; // skip invalid
            updateData[`ownedGames.${game.platform}.${game.gameId}`] = game;
        }

        
        await userModel.updateOne(
            { _id: userId },
            { $set:{...updateData} },
        );
        console.log("PSN sync completed for user:", userId);
        res.status(200).json({ message: "PSN synced successfully" });
    } 
    catch (error) 
    {
        const err = new Error("PSN login failed. Ensure NPSSO is valid.");
        next(err);
    }
};
