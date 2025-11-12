import axios from "axios";
import pLimit from "p-limit";

const CONCURRENT_LIMIT = 10; // Max 10 parallel requests
const limit = pLimit(CONCURRENT_LIMIT);

/**
 * ✅ Get profile info for any Xbox user by XUID
 */
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

/**
 * Fetch Xbox friends list with concurrency limit
 */
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

        if (!res.data?.people) return [];

        const friends = res.data.people.map(friend => ({
            externalId: friend.xuid,
            profileUrl: null,
            friendsSince: new Date(friend.addedDateTimeUtc),
        }));

        // Fetch detailed profiles with concurrency limit
        const detailedFriends = await Promise.all(
            friends.map(friend =>
                limit(async () => {
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
        console.warn(`Failed to fetch Xbox friends: ${err.message}`);
        return [];
    }
}

/**
 * Get all owned games
 */
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

        return res.data.titles.map(game => ({
            gameName: game.name,
            gameId: Number(game.titleId),
            platform: "xbox",
            lastPlayed: game.lastUnlock ? new Date(game.lastUnlock) : null,
            coverImage: null,
            hoursPlayed: null,
            achievements: [],
            progress: null,
        }));
    } catch (err) {
        console.warn(`Failed to fetch Xbox owned games: ${err.response?.status} ${err.message}`);
        return [];
    }
}

/**
 * Get achievements for a specific game
 */
export async function getXboxAchievements(xuid, titleId, userHash, xstsToken) {
    try {
        const res = await axios.get(
            `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements?titleId=${titleId}`,
            {
                headers: {
                    Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
                    "x-xbl-contract-version": "2",
                },
            }
        );

        const achievements = res.data.achievements || [];

        return achievements.map(ach => ({
            title: ach.name,
            description: ach.description || "No description available",
            unlocked: ach.progressState === "Achieved",
            dateUnlocked: ach.progressState === "Achieved" ? new Date(ach.progression?.timeUnlocked) : null,
        }));
    } catch (err) {
        console.warn(
            `Failed to fetch achievements for title ${titleId}:`,
            err.response?.status,
            err.response?.data || err.message
        );
        return [];
    }
}

/**
 * Enrich owned games with achievements & calculate progress with concurrency limit
 */
export async function enrichOwnedGamesWithAchievements(xuid, games, userHash, xstsToken) {
    const enrichedGames = await Promise.all(
        games.map(game =>
            limit(async () => {
                const achievements = await getXboxAchievements(xuid, game.gameId, userHash, xstsToken);
                const completedCount = achievements.filter(a => a.unlocked).length;
                const progress = achievements.length ? Number(((completedCount / achievements.length) * 100).toFixed(2)) : 0;

                return {
                    ...game,
                    achievements,
                    progress,
                };
            })
        )
    );

    return enrichedGames;
}
