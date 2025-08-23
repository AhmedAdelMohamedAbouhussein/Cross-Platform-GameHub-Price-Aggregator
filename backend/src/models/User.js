import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

import config from '../config.js';

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

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
    password: { 
        type: String, 
        minlength: 8, 
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
        default: null
    },
    xboxId: { 
        type: String,
        default: null
    },
    xboxAccessToken: { 
        type: String, 
        set: encrypt, 
        get: decrypt,
        default: null,
        select: false
    },
    xboxRefreshToken: { 
        type: String, 
        set: encrypt, 
        get: decrypt,
        default: null,
        select: false
    },
    signupDate: { 
        type: Date, 
        default: Date.now 
    },
    ownedGames: [{ type: String }],
    wishlist: [{ type: String }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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
        delete ret.xboxAccessToken;
        delete ret.xboxRefreshToken;
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


// ✅ Explicit unique indexes with valid partial filters
UserSchema.index(
    { steamId: 1 },
    { unique: true, partialFilterExpression: { steamId: { $type: "string" } } }
);

UserSchema.index(
    { xboxId: 1 },
    { unique: true, partialFilterExpression: { xboxId:  { $type: "string" } } }
);

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

        // Remove this user from all friends arrays
        await this.model('User').updateMany(
            { friends: userId },
            { $pull: { friends: userId } }
        );

        next();
    } catch (error) 
    {
        next(error);
    }
});


export default mongoose.model('User', UserSchema);
