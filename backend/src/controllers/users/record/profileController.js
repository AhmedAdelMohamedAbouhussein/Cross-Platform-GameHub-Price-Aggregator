import userModel from "../../../models/User.js";

/**
 * @desc    Get a user's public profile and stats
 * @route   GET /api/users/profile/:publicID
 * @access  Public (Partial data if private)
 */
export const getPublicProfile = async (req, res, next) => {
    try {
        const publicID = decodeURIComponent(req.params.publicID).trim();
        let currentUserPublicID = null;

        if (req.session?.userId) {
            const currentUser = await userModel.findById(req.session.userId);
            currentUserPublicID = currentUser?.publicID;
        }

        const targetUser = await userModel.findOne({ publicID });

        if (!targetUser || targetUser.isDeleted) {
            return res.status(404).json({ message: "User not found" });
        }

        // Basic Profile Info
        const profile = {
            name: targetUser.name,
            publicID: targetUser.publicID,
            bio: targetUser.bio,
            profilePicture: targetUser.profilePicture,
            profileVisibility: targetUser.profileVisibility,
            isLiked: targetUser.likes?.includes(currentUserPublicID),
            likesCount: targetUser.likes?.length || 0,
            friendsCount: 0,
            totalGames: 0,
            totalHours: 0,
            topGames: [],
            friendshipStatus: "none" // none, pending, accepted, requested_by_target
        };

        // Calculate Friend Count
        if (targetUser.friends) {
            for (const [platform, friendsList] of targetUser.friends.entries()) {
                profile.friendsCount += friendsList.filter(f => f.status === "accepted").length;
            }
        }

        // Check Relationship Status with viewer
        if (currentUserPublicID && targetUser.friends?.get("User")) {
            const relationship = targetUser.friends.get("User").find(f => f.user === currentUserPublicID);
            if (relationship) {
                if (relationship.status === "accepted") {
                    profile.friendshipStatus = "accepted";
                } else if (relationship.status === "pending") {
                    profile.friendshipStatus = relationship.requestedByMe ? "requested_by_target" : "pending";
                }
            }
        }

        // Privacy Check: Only show stats if public or if they are friends
        const isSelf = currentUserPublicID === publicID;
        const isFriend = profile.friendshipStatus === "accepted";
        const canSeeStats = targetUser.profileVisibility === "public" || isFriend || isSelf;

        if (canSeeStats) {
            let allGames = [];
            if (targetUser.ownedGames) {
                for (const [platform, gamesMap] of targetUser.ownedGames.entries()) {
                    for (const [gameId, game] of gamesMap.entries()) {
                        profile.totalGames++;
                        const hours = parseFloat(game.hoursPlayed) || 0;
                        profile.totalHours += hours;
                        allGames.push({
                            ...game,
                            hoursPlayed: hours
                        });
                    }
                }
            }
            // Sort top games by playtime
            profile.topGames = allGames
                .sort((a, b) => b.hoursPlayed - a.hoursPlayed)
                .slice(0, 5);
        }

        res.status(200).json({ profile });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle like on a profile
 * @route   POST /api/users/profile/:publicID/like
 * @access  Private
 */
export const toggleLike = async (req, res, next) => {
    try {
        const publicID = decodeURIComponent(req.params.publicID).trim();
        
        let currentUserPublicID = null;
        if (req.session?.userId) {
            const currentUser = await userModel.findById(req.session.userId);
            currentUserPublicID = currentUser?.publicID;
        }

        if (!currentUserPublicID) {
            return res.status(401).json({ message: "Unable to identify user session." });
        }

        if (publicID === currentUserPublicID) {
            return res.status(400).json({ message: "You cannot like your own profile" });
        }

        const targetUser = await userModel.findOne({ publicID });
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const likeIndex = targetUser.likes.indexOf(currentUserPublicID);
        let message = "";

        if (likeIndex === -1) {
            targetUser.likes.push(currentUserPublicID);
            message = "Profile liked!";
        } else {
            targetUser.likes.splice(likeIndex, 1);
            message = "Profile unliked!";
        }

        await targetUser.save();
        res.status(200).json({ message, likesCount: targetUser.likes.length });
    } catch (error) {
        next(error);
    }
};
