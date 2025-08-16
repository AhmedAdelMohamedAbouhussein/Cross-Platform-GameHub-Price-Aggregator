import axios from 'axios';

export const syncWithSteam = async (req, res, next) => 
{
    try {
        const STEAM_API_KEY = process.env.STEAM_API_KEY;
        const STEAM_ID = process.env.STEAM_ID;

        // Fetch player summaries
        const playerSummary = await axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${STEAM_ID}`);
        
        if (!playerSummary.data.response || playerSummary.data.response.players.length === 0) 
        {
            return res.status(404).json({ error: 'No games found in Steam library' });
        }

        res.status(200).json(playerSummary.data.response); // Return the first player's summary
    } 
    catch (error)
    {
        const err = new Error('Error syncing with Steam:');
        next(err);
    }
}

/*
const timestamp = 1700596265;
const date = new Date(timestamp * 1000); // multiply by 1000 to convert seconds to milliseconds
console.log(date.toUTCString());  // e.g., "Tue, 22 Nov 2023 13:04:25 GMT"

*/