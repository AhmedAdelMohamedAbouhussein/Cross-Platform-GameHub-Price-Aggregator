import axios from 'axios';
import passport from "passport";
import SteamStrategy from "passport-steam";
import config from '../config.js'
import userModel from "../models/User.js"; //TODO

import {getOwnedGames, getUserAchievements, getUserFriendList} from './allSteamInfo.js'

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

    const APP_FRONTEND_URL = config.frontendUrl;

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
        { upsert: true }
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
        { upsert: true }
      );
      
      res.redirect(`${APP_FRONTEND_URL}/library`)
    }   
    catch (dbErr) 
    {
        return next(dbErr);
    }
  })(req, res, next); // <-- still need this
};

const CLIENT_ID = config.azure.clientId;
const TENANT_ID = config.azure.tenantId;
const CLIENT_SECRET = config.azure.clientSecret;
const XBOX_REDIRECT_URI = config.xboxRedirectURL;


//                                         **xbox**


// 1. Redirect user to Microsoft login
export function syncWithXbox(req, res) 
{

  const authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
      XBOX_REDIRECT_URI
  )}&response_mode=query&scope=openid%20offline_access%20profile%20email%20XboxLive.signin`;


  res.redirect(authUrl);
}

// 2. Handle redirect + exchange code for tokens
export async function xboxReturn(req, res) 
{
  const code = req.query.code;
  if (!code) 
  {
      return res.status(400).send("No code provided");
  }

  try 
  {
    // Step 1. Exchange code for Microsoft tokens
    const tokenRes = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: XBOX_REDIRECT_URI ,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    console.log({tokenRes: tokenRes.data});
    
    const now = Date.now();
    const { access_token, refresh_token, expires_in } = tokenRes.data;
    console.log("1 is done");

    // Step 2. Authenticate with Xbox Live
    const xblAuth = await axios.post(
      "https://user.auth.xboxlive.com/user/authenticate",
      {
        Properties: {
          AuthMethod: "RPS", // Remote Procedure Call Security Token indicates token is tied to a real signed-in Microsoft account (not guest or device-based).
          SiteName: "user.auth.xboxlive.com",
          RpsTicket: `d=${access_token}`, // Microsoft access_token prefixed with "d="
        },
        RelyingParty: "http://auth.xboxlive.com",
        TokenType: "JWT",
      },
      { headers: { "Content-Type": "application/json" } }
    );
    console.log({xblAuth: xblAuth.data});

    const xblToken = xblAuth.data.Token; //proves the user signed in with Microsoft.
    const userHash = xblAuth.data.DisplayClaims.xui[0].uhs; //It’s a unique identifier that Xbox assigns to the user session. You need it together with the Xbox access token to make calls to Xbox Live APIs.

    console.log("2 is done")

    // Step 3. Get XSTS token (Xbox Secure Token Service)
    const xstsAuth = await axios.post(
      "https://xsts.auth.xboxlive.com/xsts/authorize",
      {
        Properties: {
          SandboxId: "RETAIL",
          UserTokens: [xblToken],
        },
        RelyingParty: "http://xboxlive.com",
        TokenType: "JWT",
      },
      { headers: { "Content-Type": "application/json" } }
    );
    console.log({xstsAuth: xstsAuth.data});

    const xstsToken = xstsAuth.data.Token; //proves the user is allowed to access Xbox Live services in a given sandbox (e.g. RETAIL). //lasts for 24 hours
    const xboxId = xstsAuth.data.DisplayClaims.xui[0].xid; //XUID
    const xboxGamertag = xstsAuth.data.DisplayClaims.xui[0].gtg;

    console.log(xboxId);
    console.log(xboxGamertag);

      console.log("3 is done")

    // Step 4. Store everything in session (or DB)
    //req.session.tokens = {
      //microsoftAccessToken: access_token,
      //microsoftRefreshToken: refresh_token,
      //expiresAt: now + expires_in * 1000,
      //xblToken,
      //xstsToken,
      //userHash,
    //};

    res.send("✅ Xbox authentication complete! You can now call Xbox APIs.");
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Xbox authentication failed");
  }
}



/*

const { userHash, xstsToken } = req.session.tokens;

const profile = await axios.get("https://profile.xboxlive.com/users/me/profile", {
  headers: {
    Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
    "x-xbl-contract-version": "2",
  },
});

console.log(profile.data);




import express from "express";
import axios from "axios";

const router = express.Router();

// GET achievements for a specific title
router.get("/xbox/achievements/:xuid/:titleId", async (req, res) => {
  const { xuid, titleId } = req.params;

  try {
    const response = await axios.get(
      `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements?titleId=${titleId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-xbl-contract-version": "3",
          Authorization: `XBL3.0 x=${req.session.userHash};${req.session.xstsToken}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching Xbox achievements:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

export default router;



// GET friends list
router.get("/xbox/friends/:xuid", async (req, res) => {
  const { xuid } = req.params;

  try {
    const response = await axios.get(
      `https://social.xboxlive.com/users/xuid(${xuid})/people`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-xbl-contract-version": "3",
          Authorization: `XBL3.0 x=${req.session.userHash};${req.session.xstsToken}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching Xbox friends:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

*/