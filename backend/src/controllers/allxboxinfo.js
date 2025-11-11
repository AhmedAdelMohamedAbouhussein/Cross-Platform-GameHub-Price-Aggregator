import axios from "axios";
import config from "../config.js";

const CLIENT_ID = config.azure.clientId;

// Helper: convert minutes to "Xh Ym Zs" if needed for playtime

// ✅ Get Xbox profile (Gamertag + avatar)
export async function getXboxProfile(xuid, userHash, xstsToken) {
    const res = await axios.get(
        `https://profile.xboxlive.com/users/xuid(${xuid})/profile/settings?settings=Gamertag,GameDisplayPicRaw`,
        {
            headers: {
                Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
                "x-xbl-contract-version": "2",
            },
        }
    );

    const user = res.data.profileUsers[0];
    return {
        xuid: user.id,
        gamertag: user.settings.find((s) => s.id === "Gamertag")?.value,
        avatar: user.settings.find((s) => s.id === "GameDisplayPicRaw")?.value,
    };
}


// Fetch Xbox friends list
export async function getXboxFriends(xuid, userHash, xstsToken) {
    try {
        const res = await axios.get(
            `https://social.xboxlive.com/users/xuid(${xuid})/people?view=All`,
            {
                headers: {
                    Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
                    "X-RequestedServiceVersion": 1,
                    Accept: "application/json",
                },
            }
        );

        if (!res.data || !res.data.people) return [];

        return res.data.people.map(friend => ({
            xuid: friend.xuid,
            isFavorite: friend.isFavorite || false,
            isFollowingCaller: friend.isFollowingCaller || false,
            socialNetworks: friend.socialNetworks || [],
        }));

    } catch (err) {
        console.warn(`Failed to fetch Xbox friends: ${err.message}`);
        return [];
    }
}



export async function getXboxOwnedGames(xuid, userHash, xstsToken) {
  try {
    const res = await axios.get(
      `https://achievements.xboxlive.com/users/xuid(${xuid})/history/titles`, 
      {
        headers: {
          Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
          "x-xbl-contract-version": "2",
        },
      }
    );

    if (!res.data?.titles) return [];

    return res.data.titles.map((game) => ({
      titleId: game.id,
      name: game.name,
      lastPlayed: game.lastPlayedDate ? new Date(game.lastPlayedDate) : null,
      playtimeHours: game.playedTime ? game.playedTime / 60 : 0,
      achievements: [],
      progress: null,
    }));
  } catch (err) {
    console.warn(`Failed to fetch Xbox owned games: ${err.response?.status} ${err.message}`);
    return [];
  }
}

/*
`https://achievements.xboxlive.com/users/xuid(${xuid})/achievements/title(${titleId})/achievements`,
let url = `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements`;
if (titleId) url += `/title(${titleId})`;

// ✅ Get achievements for a single game 
TODO try this first
export async function getXboxAchievements(xuid, titleId, xstsToken) {
    try 
    {
        const res = await axios.get(
            `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements`,
            {
                headers: {
                    Authorization: `XBL3.0 x=${xuid};${xstsToken}`,
                    "x-xbl-contract-version": "2",
                },
            }
        );

        const achievements = res.data.achievements || [];

        return achievements.map((ach) => ({
            id: ach.id,
            name: ach.name,
            description: ach.description,
            unlocked: ach.progressState === "Achieved",
            progress: ach.progressPercentage,
            dateUnlocked:
            ach.progressState === "Achieved" ? new Date(ach.unlockTime) : null,
        }));
    } 
    catch (err) 
    {
        console.warn(
            `Failed to fetch achievements for title ${titleId}: ${err.message}`
        );
        return [];
    }
} */

export async function getXboxAchievements(xuid, titleId, xstsToken) {
    try {
        const res = await axios.get(
            `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements`,
            {
                headers: {
                    Authorization: `XBL3.0 x=${xuid};${xstsToken}`,
                    "x-xbl-contract-version": "2",
                },
            }
        );

        const achievements = res.data.achievements || [];

        // Filter achievements by titleId in code
        const filtered = titleId ? achievements.filter(a => a.titleId === titleId) : achievements;

        return filtered.map((ach) => ({
            id: ach.id,
            name: ach.name,
            description: ach.description,
            unlocked: ach.progressState === "Achieved",
            progress: ach.progressPercentage,
            dateUnlocked: ach.progressState === "Achieved" ? new Date(ach.unlockTime) : null,
        }));
    } catch (err) {
        console.warn(`Failed to fetch achievements: ${err.message}`);
        return [];
    }
}


// ✅ Enrich owned games with achievements
export async function enrichOwnedGamesWithAchievements(xuid, games, xstsToken) {
    const enrichedGames = [];

    for (const game of games) 
    {
        const achievements = await getXboxAchievements(xuid, game.titleId, xstsToken);
        const completedCount = achievements.filter((a) => a.unlocked).length;

        enrichedGames.push({
            ...game,
            achievements,
            progress: achievements.length? Number(((completedCount / achievements.length) * 100).toFixed(2)): 0,
        });
    }

    return enrichedGames;
}
