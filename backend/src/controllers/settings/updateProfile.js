import userModel from "../../models/User.js";

export const updateProfile = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { username, bio, visibility, allowPublicFriendRequests, favoriteGames } = req.body;

        const updateData = {};
        if (username !== undefined) updateData.name = username;
        if (bio !== undefined) updateData.bio = bio;
        if (visibility !== undefined) updateData.profileVisibility = visibility;
        if (allowPublicFriendRequests !== undefined) updateData.allowPublicFriendRequests = allowPublicFriendRequests;
        if (favoriteGames !== undefined) {
            // Validate favoriteGames is an array
            if (Array.isArray(favoriteGames)) {
                // Ensure max 4 games
                updateData.favoriteGames = favoriteGames.slice(0, 4).map(game => ({
                    platform: game.platform,
                    gameId: game.gameId,
                    gameName: game.gameName,
                    coverImage: game.coverImage,
                    hoursPlayed: game.hoursPlayed || 0,
                    progress: game.progress || 0
                }));
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No data provided to update" });
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Update profile error:", error);
        next(error);
    }
};
