import userModel from '../../../models/User.js'
import { sendOtpToUser } from '../../nodeMailer/sendOtp.js';

// @desc   
// @route  PATCH /api/users/delete/:email
export const softDeletUser = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        await sendOtpToUser({ userId, email: user.email, purpose: "deactivate_account" });
        res.json({ message: "Verification code sent to your email.", userId });
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
        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        await sendOtpToUser({ userId, email: user.email, purpose: "permanently_delete_account" });
        res.json({ message: "Verification code sent to your email.", userId });
    } catch (error) {
        next(error);
    }
};