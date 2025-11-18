import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { nanoid } from "nanoid";


import config from '../config.js';

import userGameSchema from './UserGames.js'

const algorithm = config.security.algorithm;
const ENCRYPTION_KEY = Buffer.from(config.security.encryptionKey, 'hex'); // 32 bytes key
const IV_LENGTH = config.security.ivLength;
const BCRYPT_SALT_ROUNDS = config.security.bcryptSaltRounds

function encrypt(text) 
{
    if (!text) return null;
    try 
    {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Combine iv and encrypted text with colon separator
        return iv.toString('hex') + ':' + encrypted;
    } 
    catch (error) 
    {
        console.error('Encryption error:', error);
        return null;
    }
}

function decrypt(data) {
    if (!data) return null;
    try 
    {
        const parts = data.split(':');
        const iv = Buffer.from(parts.shift(), 'hex');
        const encryptedText = parts.join(':');
        const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) 
    {
        console.error('Decryption error:', error);
        return null;
    }
}

const generatePublicID = async function(name) {
    let isUnique = false;
    let newID;

    while (!isUnique) {
        const cleanName = (name || "User").replace(/\s+/g, "");
        const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5-digit number
        newID = `${cleanName}#${randomDigits}`;

        const existing = await mongoose.models.User.findOne({ publicID: newID });
        if (!existing) isUnique = true;
    }

    return newID;
};

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    publicID: {
        type: String,
        unique: true,
        required: true,
    },
    email: { 
        type: String,
        index: true, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
    password: { 
        type: String, 
        minlength: 8, 
        maxlength: 50,
        select: false,
        validate: 
        {
            validator: function (v) 
            {
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);
            },
            message: "Password must contain at least 1 uppercase, 1 lowercase, and 1 number"
        }
    },

    bio: { 
        type: String,
        maxlength: 300,  
    },
    profileVisibility: { 
        type: String,
        enum: ["public", "friends", "private"], default: "public" 
    },
    isDeleted: { 
        type: Boolean, 
        default: false 
    },
    isVerified: { 
        type: Boolean, 
        default: false 
    },
    profilePicture: {
        type: String,
    },
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    },
    steamId: { 
        type: String,
    },
    PSNId: {
        type: String,
    },
    xboxId: { 
        type: String,
    },
    xboxGamertag: {
        type: String,
    },
    xboxRefreshToken: { 
        type: String, 
        set: encrypt, 
        get: decrypt,
        select: false
    },
    xboxTokenExpiresAt: { 
        type: Date, 
        select: false
    },
    PSNRefreshToken: { 
        type: String, 
        set: encrypt, 
        get: decrypt,
        select: false
    },
    PSNTokenExpiresAt: { 
        type: Date,
        select: false 
    },  
    signupDate: { 
        type: Date, 
        default: Date.now 
    },
    ownedGames: {
        type: Map,
        of: {
            type: Map,
            of: userGameSchema
        },
    },
    wishlist: [{ type: String }],
    friends: {
        type: Map,
        of: [
            new mongoose.Schema(
            {
                user: { type: String, required: true }, // <-- store publicID, not ObjectId
                externalId: { type: String }, // platform-specific ID (SteamID, XboxID, etc.)
                displayName: { type: String }, // optional, cached name
                profileUrl: { type: String },
                avatar: { type: String }, // optional, cached avatar
                friendsSince: { type: Date },
                status: { type: String, enum: ["pending", "accepted"], default: "pending" }, // track request
                source: { type: String, enum: ["User", "Steam", "Xbox", "Epic", "PSN", "Nintendo", "GOG"], default: "User" }, // where the friend comes from
                requestedByMe: { type: Boolean, default: true }, // true if current user sent the request
            },
            { _id: false } // prevent subdocument _id
            )
        ],
    },
    resendCount: {
        emailVerification: { 
            count: { 
                type: Number, 
                default: 0,
                select: false
            },
            lastReset: { 
                type: Date, 
                default: Date.now,
                select: false
            },
        },
        passwordReset: { 
            count: { 
                type: Number, 
                default: 0,
                select: false
            },
            lastReset: { 
                type: Date, 
                default: Date.now,
                select: false
            }
        },
        restoreAccount: { 
            count: { 
                type: Number, 
                default: 0,
                select: false
            },
            lastReset: { 
                type: Date, 
                default: Date.now,
                select: false
            }
        },
        permanentlyDeleteAccount: { 
            count: { 
                type: Number, 
                default: 0,
                select: false
            },
            lastReset: { 
                type: Date, 
                default: Date.now,
                select: false
            }
        }
    }
},
{ 
    timestamps: true, 
    toJSON: { getters: true }, 
    toObject: { getters: true } 
});

UserSchema.set('toJSON', 
{
    transform: function(doc, ret, options) //doc → the original Mongoose document
    { 
        delete ret.password; //delete ret.field → removes that field before sending it to the client This applies globally whenever .toJSON() is called (e.g., res.json(user))
        delete ret.xboxRefreshToken;
        delete ret.xboxTokenExpiresAt;
        delete ret.PSNRefreshToken;
        delete ret.PSNTokenExpiresAt
        delete ret.ownedGames;
        delete ret.friends;
        delete ret.wishlist;
        delete ret.updatedAt;
        delete ret.signupDate;
        delete ret.createdAt;
        delete ret.isDeleted;
        delete ret.isVerified;
        delete ret.role;
        delete ret.__v; //remove version key
        delete ret.xboxGamertag
        delete ret._id
        delete ret.steamId
        delete ret.xboxId
        delete ret.PSNId
        delete ret.profileVisibility
        //delete ret._id;

        if (ret.resendCount) 
        {
            if(ret.resendCount.emailVerification)
            {
                delete ret.resendCount.emailVerification.count;
                delete ret.resendCount.emailVerification.lastReset;
            }
            if(ret.resendCount.passwordReset)
            {
                delete ret.resendCount.passwordReset.count;
                delete ret.resendCount.passwordReset.lastReset;
            }
            if(ret.resendCount.restoreAccount)
            {
                delete ret.resendCount.restoreAccount.count;
                delete ret.resendCount.restoreAccount.lastReset;
            }
            if(ret.resendCount.permanentlyDeleteAccount)
            {
                delete ret.resendCount.permanentlyDeleteAccount.count;
                delete ret.resendCount.permanentlyDeleteAccount.lastReset;
            }
        }
        return ret; //ret → the plain JavaScript object that will be returned
    }
});


UserSchema.pre('validate', async function(next) {
    if (!this.publicID) {
        this.publicID = await generatePublicID(this.name);
    }
    next();
});

// Hash password before saving if present
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();

    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.pre(['findOneAndUpdate', 'updateOne'], async function (next) {
    let update = this.getUpdate();

    // Normalize if $set exists
    if (update.$set && update.$set.password) {
        const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
        update.$set.password = await bcrypt.hash(update.$set.password, salt);
    } else if (update.password) {
        const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
        update.password = await bcrypt.hash(update.password, salt);
    }

    next();
});


// Compare passwords only if password exists
UserSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    const ismatch = await bcrypt.compare(candidatePassword, this.password);

    return ismatch;
};


UserSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        const userId = this._id;

        // Remove this user from all User-platform friends arrays
        await this.model('User').updateMany(
            { [`friends.User.user`]: userId },
            { $pull: { [`friends.User`]: { user: userId } } }
        );

        next();
    } catch (error) {
        next(error);
    }
});


export default mongoose.model('User', UserSchema);
