import userModel from '../../../models/User.js'

// @desc   
// @route  PATCH /api/users/delete/:email
export const softDeletUser = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        await userModel.findByIdAndUpdate(userId, { isDeleted: true });

        req.session.destroy((err) => {
            if (err) return next(err);
            res.clearCookie("connect.sid");
            res.status(200).json({ message: "Account deactivated successfully" });
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Hard delete user (Permanent)
 * @route   DELETE /api/users/delete/hard
 */
export const hardDeleteUser = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Trigger the deleteOne middleware in User.js to cleanup friends
        await user.deleteOne();

        req.session.destroy((err) => {
            if (err) return next(err);
            res.clearCookie("connect.sid");
            res.status(200).json({ message: "Account permanently deleted" });
        });
    } catch (error) {
        next(error);
    }
};