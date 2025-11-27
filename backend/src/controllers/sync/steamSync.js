import axios from 'axios';
import passport from "passport";
import SteamStrategy from "passport-steam";
import config from '../../config.js'
import userModel from "../../models/User.js"; //TODO

import {getOwnedGames, getUserAchievements, getUserFriendList} from '../allSteamInfo.js'

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
    //console.log("Steam user:", user);  // contains profile + steamid

    try 
    {
        // Example: link Steam account to your logged-in user
        const userId = req.session.userId; // however you track your user
        
        const noAchGames = await getOwnedGames(user._json.steamid);
        const games = await getUserAchievements(user._json.steamid, noAchGames);
        
        const updateData = {};
        for (const game of games) 
        {
            if (!game || !game.gameId) continue; // skip invalid
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
                        friendsSince: f.friendsSince,
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

