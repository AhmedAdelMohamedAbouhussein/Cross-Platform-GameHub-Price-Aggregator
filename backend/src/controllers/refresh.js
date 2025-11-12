import axios from "axios";
import userModel from "../models/User.js";
import config from '../config.js'
import { getOwnedGames, getUserAchievements } from "./allSteamInfo.js";
import { getXboxOwnedGames, enrichOwnedGamesWithAchievements } from "./allxboxinfo.js";

export const refreshOwnedGames = async (req, res, next) => 
{
    try 
    {
        const { userId, steamId} = req.body;
        const xuid = req.body.xboxId; // xboxId is actually xuid

        const user = await userModel.findById(userId).select("+xboxRefreshToken +xboxTokenExpiresAt");
        
        if (!user) 
        {
            return res.status(404).json({ message: "User not found" });
        }

        const xboxRefreshToken = user.xboxRefreshToken;

        // object to collect all updates
        const updateData = {};

        // ----- STEAM -----
        if (steamId) {
            const ownedGames = await getOwnedGames(steamId);
            const gamesWithAchievements = await getUserAchievements(steamId, ownedGames);

            for (const game of gamesWithAchievements) {
                updateData[`ownedGames.${game.platform}.${game.gameId}`] = game;
            }
        }

        // ----- XBOX -----
        if (xuid && user.xboxTokenExpiresAt && new Date() < user.xboxTokenExpiresAt)
        {
            const CLIENT_ID  = config.azure.clientId;
            const CLIENT_SECRET = config.azure.clientSecret;
            const REDIRECT_URI  = config.xboxRedirectURL;

            // Step 1: Exchange refresh token for new access token
            const tokenRes = await axios.post(
                "https://login.live.com/oauth20_token.srf",
                new URLSearchParams({
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    grant_type: "refresh_token",
                    refresh_token: xboxRefreshToken,
                    redirect_uri: REDIRECT_URI,
                }),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );
            console.log("1 successful token refresh");

            const accessToken = tokenRes.data.access_token;
            const newRefreshToken = tokenRes.data.refresh_token;

            // Step 2: Get Xbox user token
            const userAuthRes = await axios.post("https://user.auth.xboxlive.com/user/authenticate", {
                Properties: {
                    AuthMethod: "RPS",
                    SiteName: "user.auth.xboxlive.com",
                    RpsTicket: `d=${accessToken}`,
                },
                RelyingParty: "http://auth.xboxlive.com",
                TokenType: "JWT",
            });
            console.log("2 successful user auth");

            const userToken = userAuthRes.data.Token;
            const userHash = userAuthRes.data.DisplayClaims.xui[0].uhs;

            // Step 3: Get XSTS token
            const xstsRes = await axios.post("https://xsts.auth.xboxlive.com/xsts/authorize", {
                Properties: {
                    SandboxId: "RETAIL",
                    UserTokens: [userToken],
                },
                RelyingParty: "http://xboxlive.com",
                TokenType: "JWT",
            });
            console.log("3 successful XSTS auth");

            const xstsToken = xstsRes.data.Token;

            const noAchGames = await getXboxOwnedGames(xuid, userHash, xstsToken);
            const games = await enrichOwnedGamesWithAchievements(xuid, noAchGames, userHash, xstsToken);

            for (const game of games) {
                updateData[`ownedGames.${game.platform}.${game.gameId}`] = game;
            }

             // Step 5: Save new refresh token + expiry (90 days - 1 day)
            const xboxRefreshTokenExpiresAt = new Date(Date.now() + (90 * 24 * 60 * 60 * 1000) - (24 * 60 * 60 * 1000));
            await userModel.updateOne(
                { _id: userId },
                {
                    $set: {
                        xboxRefreshToken: newRefreshToken,
                        xboxTokenExpiresAt: xboxRefreshTokenExpiresAt,
                    },
                }
            );
        }
        else if (xuid && (!user.xboxTokenExpiresAt || new Date() > user.xboxTokenExpiresAt))
        {
            const error = new Error("Xbox refresh token expired or invalid. Please re-link your Xbox account.");
            error.status = 400;
            return next(error);
        }

        // only update if there are new/changed games
        if (Object.keys(updateData).length > 0) {
            await userModel.updateOne(
                { _id: userId },
                { $set: updateData }
            );
        }

        return res.status(200).json({ message: "Owned games refreshed successfully" });
    } catch (err) {
        console.error("Error refreshing owned games:", err);
        next(new Error("Failed to refresh owned games"));
    }
};
