import axios from 'axios';
import passport from "passport";
import SteamStrategy from "passport-steam";
import config from '../config.js'
import userModel from "../models/User.js"; //TODO

import {getOwnedGames, getUserAchievements, getUserFriendList} from './allSteamInfo.js'

const APP_FRONTEND_URL = config.frontendUrl;
const APP_BACKEND_URL = config.appUrl;
const STEAM_API_KEY = config.steam.apiKey;

//                                              **steam**

// Configure passport strategy ONCE (not inside your controller)
passport.use(
    new SteamStrategy(
    {
        returnURL: `${APP_BACKEND_URL}/sync/steam/return`,
        realm: APP_BACKEND_URL,
        apiKey: STEAM_API_KEY,
    },
    async function (identifier, profile, done) 
    {
        try 
        {
            // Extract the steamID from profile
            const steamId = profile._json.steamid;

            // Fetch player summary using Steam Web API
            const response = await axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`,
            {
                params: 
                {
                    key: STEAM_API_KEY,
                    steamids: steamId,
                },
            });

            // Attach Steam API data to profile
            const players = response.data?.response?.players;
            if (Array.isArray(players) && players.length > 0) 
            {
              profile.summary = players[0];
            } 
            else 
            {
              console.warn("No players returned from Steam API:", response.data);
              profile.summary = null;
            }
            return done(null, profile);
        } 
        catch (error) 
        {
            return done(error, null);
        }
    }));

// @desc  get steamdi and steam info
// @route GET /sync/steam
export const syncWithSteam = async (req, res, next) => 
{
    try 
    {
        passport.authenticate("steam", async (err, user) => 
        {
            if (err) 
            {
                return next(err);
            }
            if (!user) 
            {
                const error = new Error("Steam login failed");
                error.status = 401
                return next(error);
            }
            console.log(user);

            // Return both passport profile + Steam API data
            res.status(200).json( {profile: user});
        })(req, res, next);
    } 
    catch (error)
    {
        const err = new Error('Error syncing with Steam:');
        next(err);
    }
}

// @desc  get steamid and steam info
// @route GET /sync/steam/return
export const steamReturn = (req, res, next) => {

    passport.authenticate("steam", { failureRedirect: `${APP_FRONTEND_URL}/`, session: false }, async (err, user) => 
    {
    if (err) 
    {
        return next(err);
    }
    if (!user) 
    {
        return res.redirect("/"); // failed login
    }

    // ✅ Steam login succeeded
    console.log("Steam user:", user);  // contains profile + steamid

    try 
    {
        // Example: link Steam account to your logged-in user
        const userId = req.session.userId; // however you track your user

        
        const noAchGames = await getOwnedGames(userId, user._json.steamid);
        const games = await getUserAchievements(user._json.steamid, noAchGames);
        
        const updateData = {};
        for (const game of games) 
        {
          // Set/update the game under the platform map
          updateData[`ownedGames.${game.platform}.${game.gameId}`] = game;
        }

      await userModel.updateOne(
        { _id: userId },
        { $set:{...updateData, steamId: user._json.steamid} },
      );

      const friends = await getUserFriendList(user._json.steamid)

      await userModel.updateOne
      (
        { _id: userId },
        {
          $set: {
            "friends.Steam": friends.map(f => ({
              externalId: f.externalId,
              displayName: f.displayName,
              profileUrl: f.profileUrl,
              avatar: f.avatar,
              status: "accepted",
              source: "Steam"
            }))
          }
        },
      );
      
      res.redirect(`${APP_FRONTEND_URL}/library`)
    }   
    catch (dbErr) 
    {
        return next(dbErr);
    }
  })(req, res, next); // <-- still need this
};




import {getXboxProfile, getXboxFriends, getXboxOwnedGames, getXboxAchievements, enrichOwnedGamesWithAchievements} from './allxboxinfo.js'

// Xbox config
const CLIENT_ID  = config.azure.clientId;
const REDIRECT_URI  = config.xboxRedirectURL;
const CLIENT_SECRET = config.azure.clientSecret;
const TENANT_ID = config.azure.tenantId;

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



export async function xboxReturn(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).send("No code provided");

  try {
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

    // 5️⃣ Done — store tokens or redirect
    // You can save msAccessToken + msRefreshToken + xstsToken + userHash + gamertag in DB

    console.log("Xbox Auth Success:", { xuid, gamertag, userHash, xstsToken, msAccessToken, msRefreshToken });

    const profile = await getXboxProfile(xuid, userHash, xstsToken);
    console.log("Profile:", profile);

    const friends = await getXboxFriends(xuid, userHash, xstsToken);
    console.log("Friends:", friends);
    
    const noAchGames = await getXboxOwnedGames(xuid, userHash, xstsToken);
    console.log("Owned games:", noAchGames);
    
    const games = await enrichOwnedGamesWithAchievements(xuid, noAchGames, xstsToken);
    console.log("Games with achievements:", games);
    

    res.redirect(`${APP_FRONTEND_URL}/library`)

  } catch (err) {
    console.error("Xbox Auth Error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Xbox authentication failed",
      details: err.response?.data || err.message,
    });
  }
}