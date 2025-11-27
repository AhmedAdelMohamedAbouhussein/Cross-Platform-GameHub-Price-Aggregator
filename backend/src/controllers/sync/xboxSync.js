import axios from 'axios';
import config from '../../config.js'
import userModel from "../../models/User.js"; //TODO


const APP_FRONTEND_URL = config.frontendUrl;

import { getXboxFriends, getXboxOwnedGames, enrichOwnedGamesWithAchievements} from '../allxboxinfo.js'

// Xbox config
const CLIENT_ID  = config.azure.clientId;
const REDIRECT_URI  = config.xboxRedirectURL;
//"https://mariam-noncongruent-nonbeatifically.ngrok-free.dev/sync/xbox/return"; 

const CLIENT_SECRET = config.azure.clientSecret;

export function syncWithXbox(req, res) {
    const authUrl = `https://login.live.com/oauth20_authorize.srf?` +
        new URLSearchParams({
            client_id: CLIENT_ID,
            response_type: "code",
            redirect_uri: REDIRECT_URI,
            scope: "XboxLive.signin offline_access",
        });
    res.redirect(authUrl);
}


export async function xboxReturn(req, res) 
{
    const userId = req.session.userId; 

    const code = req.query.code;
    if (!code) return res.status(400).send("No code provided");

    try 
    {
        // 1️⃣ Exchange code for Microsoft access + refresh tokens
        const tokenRes = await axios.post(
            "https://login.live.com/oauth20_token.srf",
            new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                code,
                grant_type: "authorization_code",
                scope: "XboxLive.signin offline_access", // include offline_access for refresh token
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const msAccessToken = tokenRes.data.access_token;
        const msRefreshToken = tokenRes.data.refresh_token; // ← here’s your refresh token
        // Refresh token expiry: 60 days - 1 day
        const xboxTokenExpiresAt = new Date(Date.now() + (60 * 24 * 60 * 60 * 1000) - (24 * 60 * 60 * 1000));

        // 2️⃣ Authenticate with Xbox Live
        const xblRes = await axios.post(
            "https://user.auth.xboxlive.com/user/authenticate",
            {
                RelyingParty: "http://auth.xboxlive.com",
                TokenType: "JWT",
                Properties: {
                    AuthMethod: "RPS",
                    SiteName: "user.auth.xboxlive.com",
                    RpsTicket: `d=${msAccessToken}`,
                },
            },
            { headers: { "Content-Type": "application/json" } }
        );

        const xblToken = xblRes.data.Token;
        const userHash = xblRes.data.DisplayClaims.xui[0].uhs;

        // 3️⃣ Get XSTS token
        const xstsRes = await axios.post(
            "https://xsts.auth.xboxlive.com/xsts/authorize",
            {
                RelyingParty: "http://xboxlive.com",
                TokenType: "JWT",
                Properties: {
                    UserTokens: [xblToken],
                    SandboxId: "RETAIL",
                },
            },
            { headers: { "Content-Type": "application/json" } }
        );

        const xstsToken = xstsRes.data.Token;

        // 4️⃣ Get Xbox profile (Gamertag)
        const profileRes = await axios.get(
            "https://profile.xboxlive.com/users/me/profile/settings?settings=Gamertag",
            {
                headers: {
                    Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
                    "x-xbl-contract-version": "2",
                },
            }
        );

        const xuid = profileRes.data.profileUsers[0].id;
        const gamertag = profileRes.data.profileUsers[0].settings[0].value;

                await userModel.updateOne(
            { _id: userId },
            {
                $set: 
                {
                    xboxId: xuid,
                    xboxGamertag: gamertag,
                    xboxRefreshToken: msRefreshToken,
                    xboxTokenExpiresAt: xboxTokenExpiresAt
                }
            }
        );

        const friends = await getXboxFriends(xuid, userHash, xstsToken);
    
        await userModel.updateOne(
            { _id: userId },
            {
                $set: 
                {
                    "friends.Xbox": friends.map(f => ({
                        externalId: f.externalId,
                        displayName: f.displayName,
                        profileUrl: f.profileUrl,
                        avatar: f.avatar,
                        friendsSince: f.friendsSince,
                        status: "accepted",
                        source: "xbox"
                    })),
                }
            }
        );

        const noAchGames = await getXboxOwnedGames(xuid, userHash, xstsToken);
    
        const games = await enrichOwnedGamesWithAchievements(xuid, noAchGames, userHash, xstsToken);

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

        res.redirect(`${APP_FRONTEND_URL}/library`)

    } 
    catch (err) 
    {
        console.error("Xbox Auth Error:", err.response?.data || err.message);
        res.status(500).json({
            error: "Xbox authentication failed",
            details: err.response?.data || err.message,
        });
    }
}