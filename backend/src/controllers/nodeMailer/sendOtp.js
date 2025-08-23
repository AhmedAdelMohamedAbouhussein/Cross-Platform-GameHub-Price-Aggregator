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

export async function sendOtpToUser ({ userId, email })
{
    try
    {
        await OtpSchema.deleteMany({userId: userId, purpose: "email_verification"});

        const otp = `${Math.floor(1000+Math.random() * 900000)}`
        
        const mailOptions = {
            from: config.gmail.gmail,
            to: email,
            subject: "Verify Your Email",
            html: `<p>Your OTP is: <b>${otp}</b><br/>This OTP will expire in 10 minutes.</p>`
        }

        await OtpSchema.create({
            userId: userId,
            otp: otp, 
            purpose: "email_verification",
        });
        
        await transporter.sendMail(mailOptions);
        const now = new Date();

        await userModel.findByIdAndUpdate(userId, { $inc: { 'resendCount.emailVerification.count': 1 } , $set: {'resendCount.emailVerification.lastReset': now}});

    }
    catch(err)
    {
        throw err; // let the calling route handler handle it
    }
} 



// @desc  get sent otp to user
// @route  POST /api/mail/sendotp
export const sendOtp = async (req, res, next) => 
{
    try
    {
        const { userId, email } = req.body;

        if(!email || !userId)
        {
            const error= new Error("missing body parameters");
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


        if(user.isVerified)
        {
            return res.json({ message: "user already verified", verified: true});
        }

        const now = new Date();
        const otpInfo = user.resendCount.emailVerification;
        
        let updateduser = user;
        // Reset if lastReset was more than 1 day ago
        if (now - otpInfo.lastReset > 24 * 60 * 60 * 1000) // 24h in ms
        { 
            updateduser = await userModel.findByIdAndUpdate(userId, { $set: { 'resendCount.emailVerification.count': 0 ,  'resendCount.emailVerification.lastReset': now } }, { new: true });
        }

        // Limit resends to 5
        if (updateduser.resendCount?.emailVerification.count >= 5) 
        {
            const error = new Error("Maximum OTP resend attempts reached. Please try later.");
            error.status = 429;
            return next(error);
        }

        await sendOtpToUser({ userId, email , });

        res.json({
            message: "verification email sent email, OTP will expire in 10 min"
        })
    }
    catch(err)
    {
        next(err);
    }
}