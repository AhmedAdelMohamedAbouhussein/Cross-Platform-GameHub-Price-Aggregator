import axios from "axios";

// ✅ Get profile info for any Xbox user by XUID
export async function getXboxProfile(xuid, userHash, xstsToken) {
    try {
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
    } catch (err) {
        console.warn(`Failed to fetch profile for xuid ${xuid}: ${err.message}`);
        return null;
    }
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
        //console.log("Xbox Friends:", res.data);

        if (!res.data || !res.data.people) return [];

        const friends = res.data.people.map(friend => ({
            externalId: friend.xuid,
            profileUrl: null,
            friendsSince: new Date(friend.addedDateTimeUtc)
        }));
        console.log("Xbox Friends Mapped:", friends);

        const detailedFriends = [];

        for (let friend of friends) 
        {
            const profile = await getXboxProfile(friend.externalId, userHash, xstsToken);
            if (profile) 
            {
                detailedFriends.push({
                    ...friend,
                    displayName: profile.gamertag,
                    avatar: profile.avatar,
                });
            }
        }
        console.log("Xbox Friends Detailed:", detailedFriends);
        return detailedFriends;
    

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
            gameName: game.name,
            gameId: Number(game.titleId),
            platform: "xbox",
            lastPlayed: game.lastUnlock ? new Date(game.lastUnlock) : null,
            coverImage: null, // API doesn't provide this
            hoursPlayed: null, // API doesn't provide this
            achievements: [], // to be filled later
            progress: null, // to be calculated later
        }));
    } 
    catch (err) 
    {
        console.warn(`Failed to fetch Xbox owned games: ${err.response?.status} ${err.message}`);
        return [];
    }
}

export async function getXboxAchievements(xuid, titleId, userHash, xstsToken) {
    try 
    {
        const res = await axios.get(`https://achievements.xboxlive.com/users/xuid(${xuid})/achievements?titleId=${titleId}`, {
            headers: {
                Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
                "x-xbl-contract-version": "2",
            },
        });

        const achievements = res.data.achievements || [];

        return achievements.map((ach) => ({
            title: ach.name,
            description: ach.description || "No description available",
            unlocked: ach.progressState === "Achieved",
            dateUnlocked: ach.progressState === "Achieved" ? new Date(ach.progression?.timeUnlocked) : null,
            //icon: ach.mediaAssets?.find((m) => m.type === "Icon")?.url || "",
        }));

    } 
    catch (err) 
    {
        // Log detailed info for debugging
        console.warn(
            `Failed to fetch achievements for title ${titleId || "all"}:`,
            err.response?.status,
            err.response?.data || err.message
        );
        return [];
    }
}


// 3️⃣ Enrich owned games with achievements & calculate progress
export async function enrichOwnedGamesWithAchievements(xuid, games, userHash, xstsToken) {
    const enrichedGames = [];

    for (const game of games) {
        const achievements = await getXboxAchievements(xuid, game.gameId, userHash, xstsToken);
        const completedCount = achievements.filter((a) => a.unlocked).length;
        const progress = achievements.length ? Number(((completedCount / achievements.length) * 100).toFixed(2)) : 0;

        enrichedGames.push({
            gameName: game.gameName,
            gameId: game.gameId,
            platform: game.platform,
            hoursPlayed: game.hoursPlayed,
            coverImage: game.coverImage,
            progress,
            achievements,
            lastPlayed: game.lastPlayed,
        });
    }

    return enrichedGames;
}