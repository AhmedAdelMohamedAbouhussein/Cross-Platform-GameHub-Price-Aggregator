import userModel from '../../../models/User.js'
import { sendOtpToUser } from '../../nodeMailer/sendOtp.js';

// @desc   
// @route  PATCH /api/users/delete/:email
export const softDeletUser = async (req, res, next) => {
    try {
        const userId = req.session.userId;

        await sendOtpToUser({ userId, email: req.body.email, purpose: "deactivate_account" });
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

        await sendOtpToUser({ userId, email: req.body.email, purpose: "permanently_delete_account" });
        res.json({ message: "Verification code sent to your email.", userId });
    } catch (error) {
        next(error);
    }
};