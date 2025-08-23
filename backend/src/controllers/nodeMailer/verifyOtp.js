import OtpSchema from '../../models/Otp.js'
import userModel from '../../models/User.js'


// @desc   Verify user's OTP
// @route  POST /api/mail/verifyOtp
export const verifyOtp = async (req, res, next) => 
{
    try 
    {
        const { userId, otp } = req.body;

        if (!userId || !otp) 
        {
            const error = new Error("Missing OTP or userId");
            error.status = 400;
            return next(error);
        }

        const user = await userModel.findById(userId);
        if(user.isVerified)
        {
            return res.json({ message: "user already verified", verified: true});
        }
        
        const userOtpVerification = await OtpSchema.findOne({ userId, purpose: "email_verification" }) .sort({ createdAt: -1 });

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
            await OtpSchema.updateOne(
                { _id: userOtpVerification._id },
                { $inc: { attempts: 1 } }
            );


            const error = new Error(`Invalid OTP. You have ${5 - userOtpVerification.attempts - 1} attempts left.`);
            error.status = 401;
            return next(error);
        }

        // Mark user verified
        await userModel.updateOne({ _id: userId, isDeleted: false }, { isVerified: true, 'resendCount.emailVerification.count': 0 , 'resendCount.emailVerification.lastReset': new Date()});

        // Delete OTP after success
        await OtpSchema.deleteOne({ _id: userOtpVerification._id });

        return res.json({
            message: "OTP verified successfully",
            userId,
            verified: true
        });
    } 
    catch (error) 
    {
        const err = new Error( "Couldn't verify email");
        next(err)
    }
};
