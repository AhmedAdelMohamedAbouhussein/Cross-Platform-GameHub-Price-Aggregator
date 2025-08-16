import axios from 'axios';

export const getallsteaminfo = async (req, res, next) => {
    try 
    {
        const STEAM_API_KEY = process.env.STEAM_API_KEY;
        const STEAM_ID = req.params.steamid;
        
        const steamLibrary = await axios.get(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=true&format=json`); //GET Owned Games

        //https://store.steampowered.com/api/appdetails?appids={appid}                                                                                      //get game details if needed for public api
        //http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&steamid=76561197960435530&relationship=friend    //get friends list
        //http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=440&key=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&steamid=76561197972495328   //get achievmets 
        //http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=440&format=xml                                   // get global achievement percentages
        //http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=XXXXXXXXXXXXXXXXXXXXXXX&steamids=76561197960435530                           // get player summaries
        
        if(!appids || appids.length === 0) 
        {
            return res.status(404).json({ error: 'No games found in Steam library' });
        }
        res.status(200).json(steamLibrary.data.response.games);
    } 
    catch (error) 
    {
        const err = new Error('Error fetching Steam library:');
        next(err);
    }
}