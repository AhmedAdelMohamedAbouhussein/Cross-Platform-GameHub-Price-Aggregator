import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import config from '../config.js';

const BCRYPT_SALT_ROUNDS = config.security.bcryptSaltRounds

const OtpSchema  = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // usually reference the User model
        ref: "User",
        required: true
    },
    otp: { 
        type: String, 
        required: true,
        trim: true
    },
    createdAt: { 
        type: Date,
        default: Date.now,
        expires: 600 // auto-delete after 10 minutes (600 seconds)
    },
    purpose: {
        type: String,
        enum: ["email_verification", "password_reset", "restore_account", "permanently_delete_account"],
        required: true
    },
    attempts: {
    type: Number,
    default: 0
    }
}, 
{ 
    timestamps: true, 
});

OtpSchema.set('toJSON', 
{
    transform: function(doc, ret, options) //doc → the original Mongoose document
    { 
        delete ret.otp; 
        return ret; //ret → the plain JavaScript object that will be returned
    }
});

// Hash password before saving if present
OtpSchema.pre('save', async function (next) 
{
    if (!this.isModified('otp') || !this.otp) return next();

    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    this.otp = await bcrypt.hash(this.otp, salt);
    next();
});

// Compare passwords only if password exists
OtpSchema.methods.compareOtp = async function (candidateOtp) {
    if (!this.otp) return false;
    const ismatch = await bcrypt.compare(candidateOtp, this.otp);

    return ismatch;
};
// Add index

OtpSchema.index({ userId: 1, purpose: 1, createdAt: -1 });

export default mongoose.model('Otp', OtpSchema );