import axios from 'axios';
import config from '../config.js'

        //https://store.steampowered.com/api/appdetails?appids={appid}                                                                                      //get game details if needed for public api
        //http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&steamid=76561197960435530&relationship=friend    //get friends list
        //http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=440&key=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&steamid=76561197972495328   //get achievmets 
        //http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=440&format=xml                                   // get global achievement percentages
        //http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=XXXXXXXXXXXXXXXXXXXXXXX&steamids=76561197960435530                           // get player summaries

const STEAM_API_KEY = config.steam.apiKey;

// Helper: convert minutes to "Xh Ym Zs"
function formatPlaytime(minutes) 
{
    if (!minutes || minutes <= 0) return "0h 0m 0s";

    const totalSeconds = minutes * 60;
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hours}h ${mins}m ${secs}s`;
}

// ✅ Fetch owned games
export async function getOwnedGames(userId, steamId) 
{
    const steamLibrary = await axios.get(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true&format=json`
    );

    const response = steamLibrary.data.response;

    if (!response?.games) 
    {
        throw new Error("No games found (maybe Steam account has no games?)");
    }

    // Build game list
    const games = response.games.map((game) => ({
        userId: userId,
        gameName: game.name,
        gameId: game.appid,
        platform: "steam",
        hoursPlayed: formatPlaytime(game.playtime_forever), // ✅ save as string
        coverImage: `https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/header.jpg`,
        progress: null,
    achievements: [],
    lastPlayed: game.rtime_last_played !== 0? new Date(game.rtime_last_played * 1000) : null, }));

    return games; 
}

// ✅ Fetch achievements for each owned game
export async function getUserAchievements(steamId, games) 
{
    const STEAM_API_KEY = config.steam.apiKey;
    const gamesWithAchievements = [];

    for (const game of games) 
    {
        try 
        {
        const achievementResponse = await axios.get(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&appid=${game.gameId}&l=en`);

        const achievements = achievementResponse.data?.playerstats?.achievements || [];

        if (!achievements.length) 
        {
            console.warn(
                `No achievements for game ${game.gameName} (${game.gameId}) or profile private`
            );
            continue;
        }
    
        let completedCount = 0;
        game.achievements = achievements.map((ach) => 
        {
            const unlocked = ach.achieved === 1;
            if (unlocked) completedCount++;  // count completed achievements

            return {
                title: ach.name,        // should be apiname but idc 
                description: ach.description || "No description available",
                unlocked: unlocked,
                dateUnlocked: ach.unlocktime ? new Date(ach.unlocktime * 1000) : null,
            };
        });

        // Add the count of completed achievements to the game object
        game.progress = achievements.length? Number(((completedCount / achievements.length) * 100).toFixed(2)): 0;

        gamesWithAchievements.push(game); // keep this game
        }
        catch (err) 
        {
            console.warn(`Failed to fetch achievements for game ${game.gameName} (${game.gameId}): ${err.message}`);
        }
    }

    return gamesWithAchievements; // games now enriched with achievements
}


export async function getUserFriendList(steamId) 
{
    try 
    {
        // Step 1: Get friend IDs
        const response = await axios.get(`http://api.steampowered.com/ISteamUser/GetFriendList/v0001/`,
            {
                params: {
                    key: STEAM_API_KEY,
                    steamid: steamId,
                    relationship: "friend"
                }
            }
        );

        const friendList = response.data.friendslist?.friends || [];
        const friendIDs = friendList.map(friend => friend.steamid);

        if (friendIDs.length === 0) return [];

        // Step 2: Split into chunks of 100 (Steam API limit)
        const chunkSize = 100;
        const chunks = [];
        for (let i = 0; i < friendIDs.length; i += chunkSize) {
            chunks.push(friendIDs.slice(i, i + chunkSize).join(","));
        }

        // Step 3: Fetch player summaries in parallel
        const requests = chunks.map(chunk =>
            axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`, {
                params: {
                    key: STEAM_API_KEY,
                    steamids: chunk
                }
            })
        );

        const results = await Promise.all(requests);

        // Step 4: Merge players into one array
        const allPlayers = results.flatMap(r => r.data.response.players);

        // Step 5: Transform into your final format
        const filteredFriends = allPlayers.map(friend => ({
            externalId: friend.steamid,
            displayName: friend.personaname,
            profileUrl: friend.profileurl,
            avatar: friend.avatarfull
        }));

        return filteredFriends;

    } catch (error) {
        console.warn(`Failed to fetch user Friends List: ${error.message}`);
        return [];
    }
}
