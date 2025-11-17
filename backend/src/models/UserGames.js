import mongoose from 'mongoose';

const userGameSchema = new mongoose.Schema({
        gameName: {
            type: String,
            required: true,
        },
        gameId: {
            type: Number,
            required: true,
        },
        platform: {
            type: String,
            required: true,
        },
        hoursPlayed:{
            type: String,
            default: null,
        },
        coverImage: {
            type: String, // URL to the game's cover image
            default: null,
        },
        progress: {
            type: Number, // Percentage completion 0-100
            default: 0,
            min: 0,
            max: 100,
        },
        achievements: [
            {
                title: { type: String },
                description: { type: String },
                unlocked: { type: Boolean, default: false },
                dateUnlocked: { type: Date },
                type: { type: String, enum: ["default", "Bronze", "Silver", "Gold", "Platinum"], default: "default" },
            }
        ],
        lastPlayed: {
            type: Date,
            default: null
        }
}, { _id: false });

export default userGameSchema; // ✅ export schema, not model