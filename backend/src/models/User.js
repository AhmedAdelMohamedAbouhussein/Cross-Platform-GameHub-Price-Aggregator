import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import config from '../config.js';

const algorithm = config.security.algorithm;
const ENCRYPTION_KEY = Buffer.from(config.security.encryptionKey, 'hex'); // 32 bytes key
const IV_LENGTH = config.security.ivLength;
const BCRYPT_SALT_ROUNDS = config.security.bcryptSaltRounds

function encrypt(text) {
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
    googleLoggedIn: { 
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
        default: null 
    },
    xboxRefreshToken: { 
        type: String, 
        set: encrypt, 
        get: decrypt,
        default: null
    },
    signupDate: { 
        type: Date, 
        default: Date.now 
    },
    ownedGames: [{ type: String }],
    wishlist: [{ type: String }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, 
{ 
    timestamps: true, 
    toJSON: { getters: true }, 
    toObject: { getters: true } 
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
    const saltRounds = BCRYPT_SALT_ROUNDS;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare passwords only if password exists
UserSchema.methods.comparePassword = function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
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
