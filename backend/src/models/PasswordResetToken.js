// /models/PasswordResetToken.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const BCRYPT_SALT_ROUNDS = 10;

const PasswordResetTokenSchema = new mongoose.Schema(
{
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    tokenHash: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300, // auto-delete after 5 minutes
    },
},
    { timestamps: true }
);

// Hide tokenHash when converting to JSON
PasswordResetTokenSchema.set("toJSON", 
{
    transform: function (doc, ret) {
        delete ret.tokenHash;
        return ret;
    },
});

// Compare candidate token with stored hash
PasswordResetTokenSchema.methods.compareToken = async function (candidateToken) 
{
    if (!this.tokenHash) return false;
    return bcrypt.compare(candidateToken, this.tokenHash);
};

// Helper to create a hashed token
PasswordResetTokenSchema.statics.createToken = async function (userId, plainToken) {
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const tokenHash = await bcrypt.hash(plainToken, salt);

    return this.create({
        userId,
        tokenHash,
    });
};

export default mongoose.model("PasswordResetToken", PasswordResetTokenSchema);
