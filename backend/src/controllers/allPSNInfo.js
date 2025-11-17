import {

    getTitleTrophies,
    getUserTitles,
    getUserTrophiesEarnedForTitle,
    //TrophyRarity,
    getUserFriendsAccountIds,
    getProfileFromAccountId 
} from "psn-api";


export const getFriendList = async (authorization) => {
    const response = await getUserFriendsAccountIds(authorization, "me");
    const friends = response.friends || [];

    // Fetch all friend profiles in parallel
    const friendProfiles = await Promise.all(
        friends.map(async (friend) => {
            const profile = await getProfileFromAccountId(authorization, friend);
            return {
                externalId: friend,
                displayName: profile.onlineId,
                avatar: profile.avatars[2]?.url || null,
                status: "accepted",
                source: "psn",
                friendsSince: null,
                profileUrl: "https://profile.playstation.com/" + profile.onlineId,
            };
        })
    );

    return friendProfiles;
};


export const getAllOwnedGames = async (authorization) => {
    const result = await getUserTitles({ accessToken: authorization.accessToken }, "me");
    const trophyTitles = result.trophyTitles || [];

    // Fetch all games in parallel
    const games = await Promise.all(
        trophyTitles.map(async (title, idx) => {
            const npServiceName = title.trophyTitlePlatform.includes("PS5") ? undefined : "trophy";

            const [titleTrophies, earnedTrophies] = await Promise.all([
                getTitleTrophies(authorization, title.npCommunicationId, "all", { npServiceName }),
                getUserTrophiesEarnedForTitle(authorization, "me", title.npCommunicationId, "all", { npServiceName })
            ]);

            const mergedTrophies = mergeTrophyLists(titleTrophies.trophies, earnedTrophies.trophies);

            return {
                gameName: title.trophyTitleName,
                gameid: idx,
                platform: "PSN",
                progress: title.progress,
                coverImage: title.trophyTitleIconUrl,
                achievements: mergedTrophies,
                hoursPlayed: null,
                lastPlayed: null,
            };
        })
    );

    return games;
};




// ---------------- Helper Functions ----------------

const mergeTrophyLists = (titleTrophies, earnedTrophies) => {
    const mergedTrophies = [];

    for (const earnedTrophy of earnedTrophies) {
        const foundTitleTrophy = titleTrophies.find(
            (t) => t.trophyId === earnedTrophy.trophyId
        );

        mergedTrophies.push(normalizeTrophy({ ...earnedTrophy, ...foundTitleTrophy }));
    }

    return mergedTrophies;
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