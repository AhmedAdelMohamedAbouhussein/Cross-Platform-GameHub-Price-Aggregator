import axios from 'axios';
import passport from "passport";
import SteamStrategy from "passport-steam";
import config from '../config.js'
import userModel from "../models/User.js"; //TODO

const APP_BACKEND_URL = config.appUrl;
const STEAM_API_KEY = config.steam.apiKey

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
            profile.summary = response.data.response.players?.[0] || null;

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
        passport.authenticate("steam", (err, user) => 
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

    passport.authenticate("steam", { failureRedirect: "/", session: false }, async (err, user) => 
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
        const myUserId = req.session.userId; // however you track your user
        await userModel.findByIdAndUpdate(myUserId, 
        {
            steamId: user._json.steamid,
        });

        // Redirect to frontend
        return res.redirect(`${APP_FRONTEND_URL}/library`);
    }   
    catch (dbErr) 
    {
        return next(dbErr);
    }
  })(req, res, next); // <-- still need this
};