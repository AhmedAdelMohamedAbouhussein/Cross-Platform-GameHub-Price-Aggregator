import axios from "axios";
import pLimit from "p-limit";
import http from "http";
import https from "https";

// Concurrency limits
const ACHIEVEMENT_CONCURRENCY = 10;
const FRIENDS_CONCURRENCY = 5;
const achievementLimit = pLimit(ACHIEVEMENT_CONCURRENCY);
const friendsLimit = pLimit(FRIENDS_CONCURRENCY);

// Axios with TCP keep-alive for maximum speed
const axiosClient = axios.create({
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
    timeout: 8000
});

/**
 * Fetch Xbox profile (NO CACHE)
 */
export async function getXboxProfile(xuid, userHash, xstsToken) {
    try {
        const res = await axiosClient.get(
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
            gamertag: user.settings.find(s => s.id === "Gamertag")?.value,
            avatar: user.settings.find(s => s.id === "GameDisplayPicRaw")?.value,
        };

    } catch (err) {
        console.warn(`Failed profile ${xuid}: ${err.message}`);
        return null;
    }
}

/**
 * Fetch friends list (fresh every time, no cache)
 */
export async function getXboxFriends(xuid, userHash, xstsToken) {
    try {
        const res = await axiosClient.get(
            `https://social.xboxlive.com/users/xuid(${xuid})/people?view=All`,
            {
                headers: {
                    Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
                    "X-RequestedServiceVersion": 1,
                    Accept: "application/json",
                },
            }
        );

        if (!res.data?.people) return [];

        const friends = res.data.people.map(friend => ({
            externalId: friend.xuid,
            profileUrl: null,
            friendsSince: new Date(friend.addedDateTimeUtc),
        }));

        // Fetch profiles in parallel
        const detailed = await Promise.all(
            friends.map(friend =>
                friendsLimit(async () => {
                    const profile = await getXboxProfile(friend.externalId, userHash, xstsToken);
                    if (!profile) return null;
                    return {
                        ...friend,
                        displayName: profile.gamertag,
                        avatar: profile.avatar,
                    };
                })
            )
        );

        return detailedFriends.filter(f => f !== null);

    } catch (err) {
        console.warn(`Friends error: ${err.message}`);
        return [];
    }
}

/**
 * Get all owned games
 */
export async function getXboxOwnedGames(xuid, userHash, xstsToken) {
    try {
        const res = await axiosClient.get(
            `https://achievements.xboxlive.com/users/xuid(${xuid})/history/titles`,
            {
                headers: {
                    Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
                    "x-xbl-contract-version": "2",
                },
            }
        );

        if (!res.data?.titles) return [];

        return res.data.titles.map(game => ({
            gameName: game.name,
            gameId: game.titleId,
            platform: "xbox",
            lastPlayed: game.lastUnlock ? new Date(game.lastUnlock) : null,
            coverImage: null,
            hoursPlayed: null,
            achievements: [],
            progress: null,
        }));

    } catch (err) {
        console.warn(`Owned games error: ${err.message}`);
        return [];
    }
}

/**
 * Fetch achievements fresh every time
 */
export async function getXboxAchievements(xuid, titleId, userHash, xstsToken) {
    try {
        const res = await axiosClient.get(
            `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements?titleId=${titleId}`,
            {
                headers: {
                    Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
                    "x-xbl-contract-version": "2",
                },
            }
        );

        return (res.data.achievements || []).map(ach => ({
            title: ach.name,
            description: ach.description || "No description",
            unlocked: ach.progressState === "Achieved",
            dateUnlocked: ach.progressState === "Achieved" ? new Date(ach.progression?.timeUnlocked) : null,
        }));

    } catch (err) {
        console.warn(`Achievements error ${titleId}: ${err.message}`);
        return [];
    }
}

/**
 * Enrich games with achievements (parallel, no cache)
 */
export async function enrichOwnedGamesWithAchievements(xuid, games, userHash, xstsToken) {
    return await Promise.all(
        games.map(game =>
            achievementLimit(async () => {
                const achievements = await getXboxAchievements(
                    xuid,
                    game.gameId,
                    userHash,
                    xstsToken
                );

                const completed = achievements.filter(a => a.unlocked).length;
                const progress = achievements.length
                    ? Number(((completed / achievements.length) * 100).toFixed(2))
                    : 0;

                return { ...game, achievements, progress };
            })
        )
    );
}
