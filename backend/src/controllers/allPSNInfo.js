import {
    getTitleTrophies,
    getUserTitles,
    getUserTrophiesEarnedForTitle,
    //TrophyRarity,
    getUserFriendsAccountIds,
    getProfileFromAccountId
} from "psn-api";

import http from "http";
import https from "https";
import pLimit from "p-limit";

// Global TCP keep-alive (same as Steam/Xbox)
const agent = {
    http: new http.Agent({ keepAlive: true }),
    https: new https.Agent({ keepAlive: true })
};

// Concurrency limits
const ACHIEVEMENT_CONCURRENCY = 10;
const FRIENDS_CONCURRENCY = 5;
const achievementLimit = pLimit(ACHIEVEMENT_CONCURRENCY);
const friendsLimit = pLimit(FRIENDS_CONCURRENCY);

// -------- FRIEND LIST --------

export const getFriendList = async (authorization) => {
    const response = await getUserFriendsAccountIds(authorization, "me", {
        agent
    });

    const friends = response.friends || [];

    const friendProfiles = await Promise.all(
        friends.map((friend) =>
            friendsLimit(async () => {
                const profile = await getProfileFromAccountId(
                    authorization,
                    friend,
                    { agent }
                );

                return {
                    externalId: friend,
                    displayName: profile.onlineId,
                    avatar: profile.avatars[2]?.url || null,
                    status: "accepted",
                    source: "psn",
                    friendsSince: null,
                    profileUrl: "https://profile.playstation.com/" + profile.onlineId
                };
            })
        )
    );

    return friendProfiles;
};

// -------- OWNED GAMES --------

export const getAllOwnedGames = async (authorization) => {
    const result = await getUserTitles(
        { accessToken: authorization.accessToken },
        "me",
        { agent }
    );

    const trophyTitles = result.trophyTitles || [];

    const games = await Promise.all(
        trophyTitles.map((title, idx) =>
            achievementLimit(async () => {
                const npServiceName =
                    title.trophyTitlePlatform.includes("PS5")
                        ? undefined
                        : "trophy";

                const [titleTrophies, earnedTrophies] = await Promise.all([
                    getTitleTrophies(
                        authorization,
                        title.npCommunicationId,
                        "all",
                        { npServiceName, agent }
                    ),
                    getUserTrophiesEarnedForTitle(
                        authorization,
                        "me",
                        title.npCommunicationId,
                        "all",
                        { npServiceName, agent }
                    )
                ]);

                const mergedTrophies = mergeTrophyLists(
                    titleTrophies.trophies,
                    earnedTrophies.trophies
                );

                return {
                    gameName: title.trophyTitleName,
                    gameId: idx,
                    platform: "PSN",
                    progress: title.progress,
                    coverImage: title.trophyTitleIconUrl,
                    achievements: mergedTrophies,
                    hoursPlayed: null,
                    lastPlayed: null
                };
            })
        )
    );

    return games;
};

// ---------------- Helper Functions ----------------

const mergeTrophyLists = (titleTrophies, earnedTrophies) => {
    const merged = [];

    for (const earned of earnedTrophies) {
        const base = titleTrophies.find(
            (t) => t.trophyId === earned.trophyId
        );

        merged.push(
            normalizeTrophy({
                ...base,
                ...earned
            })
        );
    }

    return merged;
};

const normalizeTrophy = (trophy) => {
    return {
        unlocked: trophy.earned ?? false,
        dateUnlocked: trophy.earned ? new Date(trophy.earnedDateTime) : null,
        description: trophy.trophyDetail? trophy.trophyDetail : "",
        type: trophy.trophyType,
        //rarity: rarityMap[trophy.trophyRare ?? 0],
        //earnedRate: Number(trophy.trophyEarnedRate),
        title: trophy.trophyName,
        //groupId: trophy.trophyGroupId
    };
};

//const rarityMap = {
    //[TrophyRarity.VeryRare]: "Very Rare",
    //[TrophyRarity.UltraRare]: "Ultra Rare",
    //[TrophyRarity.Rare]: "Rare",
    //[TrophyRarity.Common]: "Common"
//};