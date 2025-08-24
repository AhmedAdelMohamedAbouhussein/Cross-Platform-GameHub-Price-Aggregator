import crypto from "crypto";

import OtpSchema from '../../models/Otp.js'
import userModel from '../../models/User.js'
import PasswordResetToken from "../../models/PasswordResetToken.js";

// @desc   Verify user's OTP
// @route  POST /api/mail/verifyOtp
export const verifyOtp = async (req, res, next) => 
{
    try 
    {
        const { userId, otp, purpose } = req.body;

        if (!userId || !otp || !purpose) 
        {
            const error = new Error("Missing OTP or userId");
            error.status = 400;
            return next(error);
        }
        const user = await userModel.findById(userId);
        if(!user)
        {
            const error = new Error("Invalid user ID");
            error.status = 400;
            return next(error);
        }

        const userOtpVerification = await OtpSchema.findOne({ userId, purpose: purpose }) .sort({ createdAt: -1 });

        if (!userOtpVerification) 
        {
            const error = new Error("OTP expired, please request a new one.");
            error.status = 400;
            return next(error);
        }
        else
        {
            const now = new Date();
            const expiresAt = new Date(userOtpVerification.createdAt.getTime() + 10 * 60000);
            if (now > expiresAt) 
            {
                await OtpSchema.deleteOne({ _id: userOtpVerification._id });
                const error = new Error("OTP expired, please request a new one.");
                error.status = 400;
                return next(error);
            }
        }

        if (userOtpVerification.attempts >= 5) 
        {
            await OtpSchema.deleteOne({ _id: userOtpVerification._id });
            const error = new Error("Too many failed attempts. request a new one.");
            error.status = 429;
            return next(error);
        }

        // Verify OTP
        const isMatch = await userOtpVerification.compareOtp(otp);
        if (!isMatch) 
        {
            // Increment attempts
            await OtpSchema.updateOne({ _id: userOtpVerification._id }, { $inc: { attempts: 1 } });

            const error = new Error(`Invalid OTP. You have ${5 - userOtpVerification.attempts - 1} attempts left.`);
            error.status = 401;
            return next(error);
        }


        if (purpose === "email_verification") 
        {
            await userModel.updateOne({ _id: userId, isDeleted: false }, { isVerified: true, 'resendCount.emailVerification.count': 0 , 'resendCount.emailVerification.lastReset': new Date()});
            
            // Delete OTP after success
            await OtpSchema.deleteOne({ _id: userOtpVerification._id });

            return res.json({
                message: "Email verified successfully",
                userId,
                verified: true
            });
        } 
        else if (purpose === "password_reset") 
        {
            await userModel.updateOne({ _id: userId, isDeleted: false }, {'resendCount.passwordReset.count': 0 , 'resendCount.passwordReset.lastReset': new Date()});
            
            // Delete OTP after success
            await OtpSchema.deleteOne({ _id: userOtpVerification._id });

            // Generate a secure random token (plain)
            const plainToken = crypto.randomBytes(32).toString("hex");

            //delete old tokens
            await PasswordResetToken.deleteMany({ userId: userId});

            // Save hashed version in DB
            await PasswordResetToken.createToken(userId, plainToken);

            return res.json({
                message: "OTP verified successfully. Use this token to reset your password.",
                userId,
                verified: true,
                resetToken: plainToken, // ⚠️ send plain token only once
            });
        }
        else if (purpose === "restore_account") 
        {
            await userModel.updateOne({ _id: userId }, { isDeleted: false, 'resendCount.restoreAccount.count': 0 , 'resendCount.restoreAccount.lastReset': new Date()});
        
            // Delete OTP after success
            await OtpSchema.deleteOne({ _id: userOtpVerification._id });

            return res.json({
                message: "Account restored successfully",
                userId,
                verified: true
            });
        }
        else if (purpose === "permanently_delete_account") 
        {
            await userModel.deleteOne({_id: userId});
        
            // Delete OTP after success
            await OtpSchema.deleteOne({ _id: userOtpVerification._id });

            return res.json({
                message: "Account permanently deleted successfully",
                userId,
                verified: true
            });
        }
    } 
    catch (error) 
    {
        next(error);
    }
};
