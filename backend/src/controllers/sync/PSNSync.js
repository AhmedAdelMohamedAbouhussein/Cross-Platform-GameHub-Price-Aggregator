import { exchangeAccessCodeForAuthTokens, exchangeNpssoForAccessCode, getProfileFromUserName } from "psn-api";
import { getAllOwnedGames, getFriendList } from "../allPSNinfo.js";
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

        //const response = await getProfileFromUserName(authorization, "me");
        //console.log("1");

        const friends = await getFriendList(authorization);
        console.log("2");
        await userModel.updateOne
        (
            { _id: userId },
            {
                $set: 
                {
                    "friends.PSN": friends,
                }
            },
        );

        const games = await getAllOwnedGames(authorization);
        console.log("3");

        const updateData = {};
        
        for (const game of games) 
        {
            // Set/update the game under the platform map
            let stringGameId = String(game.gameid);
            updateData[`ownedGames.${game.platform}.${stringGameId}`] = game;
        }
        
        await userModel.updateOne(
            { _id: userId },
            { $set:{...updateData} },
        );
        console.log("PSN sync completed for user:", userId);
        res.status(200).json({ message: "PSN synced successfully" });
    } 
    catch (err) 
    {
        console.error(err);
        res.status(500).json({ error: "PSN login failed. Ensure NPSSO is valid." });
    }
};
