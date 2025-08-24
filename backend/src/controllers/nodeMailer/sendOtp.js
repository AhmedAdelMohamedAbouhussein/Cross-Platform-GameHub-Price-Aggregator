import nodemailer from 'nodemailer';

import OtpSchema from '../../models/Otp.js'
import userModel from '../../models/User.js';

import config from '../../config.js'

let transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,                // Usually 465 (SSL) or 587 (TLS)
    secure: true,             // true for port 465, false for 587              
    auth: {
        user: config.gmail.gmail,
        pass: config.gmail.password,
    },
})

export async function sendOtpToUser ({ userId, email, purpose})
{
    try
    {
        await OtpSchema.deleteMany({userId: userId, purpose: purpose});

        const otp = String(Math.floor(100000 + Math.random() * 900000)); // ensures 6 digits
        
        const mailOptions = {
            from: config.gmail.gmail,
            to: email,
            subject: "Verify Your Email",
            html: `<p>Your OTP is: <b>${otp}</b><br/>This OTP will expire in 10 minutes.</p>`
        }

        await OtpSchema.create({
            userId: userId,
            otp: otp, 
            purpose: purpose,
        });
        
        await transporter.sendMail(mailOptions);

        const now = new Date();

        if(purpose === "email_verification")
        {
            await userModel.findByIdAndUpdate(userId, { $inc: { 'resendCount.emailVerification.count': 1 } , $set: {'resendCount.emailVerification.lastReset': now}});
        }
        if(purpose === "password_reset")
        {
            await userModel.findByIdAndUpdate(userId, { $inc: { 'resendCount.passwordReset.count': 1 } , $set: {'resendCount.passwordReset.lastReset': now}});
        }
        if(purpose === "restore_account")
        {
            await userModel.findByIdAndUpdate(userId, { $inc: { 'resendCount.restoreAccount.count': 1 } , $set: {'resendCount.restoreAccount.lastReset': now}});
        }
        if(purpose === "permanently_delete_account")
        {
            await userModel.findByIdAndUpdate(userId, { $inc: { 'resendCount.permanentlyDeleteAccount.count': 1 } , $set: {'resendCount.permanentlyDeleteAccount.lastReset': now}});
        }

    }
    catch(err)
    {
        throw err; // let the calling route handler handle it
    }
} 

async function checkResendLimit(user, userId, purposeKey) {
    const now = new Date();
    const otpInfo = user.resendCount[purposeKey];
    let updatedUser = user;

    if (now - otpInfo.lastReset > 24 * 60 * 60 * 1000) {
        updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: { [`resendCount.${purposeKey}.count`]: 0, [`resendCount.${purposeKey}.lastReset`]: now } },
            { new: true }
        );
    }

    if (updatedUser.resendCount?.[purposeKey].count >= 5) {
        const error = new Error("Maximum OTP resend attempts reached. Please try later.");
        error.status = 429;
        throw error;
    }
}


// @desc  get sent otp to user
// @route  POST /api/mail/sendotp
export const sendOtp = async (req, res, next) => 
{
    try
    {
        const { userId, email, purpose } = req.body;

        if(!email || !userId || !purpose)
        {
            const error= new Error("missing body parameters");
            error.status = 400;
            return next(error);
        }
        
        if (!["email_verification", "password_reset", "restore_account", "permanently_delete_account"].includes(purpose)) {
            const error = new Error("Invalid OTP purpose");
            error.status = 400;
            return next(error);
        }

        // Fetch user to check resend count
        const user = await userModel.findById(userId);
        if (!user) 
        {
            const error = new Error("User not found");
            error.status = 404;
            return next(error);
        }

        if (purpose === "email_verification") 
        {
            if (user.isVerified) 
            {
                const error = new Error("User already verified")
                error.status = 500;
                return next(error);
            }

            await checkResendLimit(user, userId, "emailVerification");
        }

        if (purpose === "password_reset") 
        {
            await checkResendLimit(user, userId, "passwordReset");
        }
        
        if (purpose === "restore_account") 
        {
            if(user.isDeleted === false)
            {
                const error = new Error("User isnt deleted")
                error.status = 500;
                return next(error);
            }
            await checkResendLimit(user, userId, "restoreAccount");
        }
        
        if (purpose === "permanently_delete_account") 
        {
            await checkResendLimit(user, userId, "permanentlyDeleteAccount");
        }
        
        await sendOtpToUser({ userId, email, purpose});


        res.json({
            message: "verification email sent successfully, OTP will expire in 10 min"
        })
    }
    catch(err)
    {
        next(err);
    }
}