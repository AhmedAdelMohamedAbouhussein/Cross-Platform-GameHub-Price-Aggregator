import express from 'express';
import cors from 'cors';
import session from 'express-session';
import mongoose from 'mongoose';
import MongoStore  from 'connect-mongo';

import config from './config.js'

import Auth from './routes/Auth.js';
import games from './routes/games.js';
import sync from './routes/sync.js';
import usersCRUD from './routes/users.js';
import NodeMailer from './routes/nodeMailer.js';
import Friends from './routes/Friends.js'
import Settings from './routes/settings.js';
import Refresh from './routes/refresh.js';

import logger from './middleware/logger.js';
import errorHandeler from './middleware/error.js';
import notfound from './middleware/notfound.js';

import userModel from './models/User.js'
import OtpSchema from './models/Otp.js';
import ResetPasswordSchema from './models/PasswordResetToken.js'

const app = express();
const PORT = config.port;
const MONGO_URL = config.mongoLocal;
const APP_BACKEND_URL = config.appUrl;
const NODE_ENV = config.nodeEnv;
const SESSION_SECRET = config.sessionSecret;

//middleware
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://mariam-noncongruent-nonbeatifically.ngrok-free.dev" // ngrok domain 
];

app.use(cors({
    origin: function (origin, callback) 
    {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) 
        {
            return callback(null, true);
        } 
        else 
        {
            return callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

app.use(logger);
app.use(session({   // Session middleware
    secret: SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGO_URL,
        collectionName: 'sessions'
    }),
    cookie: 
    {
        httpOnly: true,
        secure: config.nodeEnv === "production", // set true only if using HTTPS
        sameSite: config.nodeEnv === "production" ? "none" : "lax",
    }
}));

//routes
app.use('/api/auth', Auth);
app.use('/games', games);
app.use('/api/users', usersCRUD);
app.use('/sync', sync);
app.use('/api/mail', NodeMailer);
app.use('/friends', Friends)
app.use('/setting', Settings);
app.use('/refresh', Refresh);

//middleware
app.use(notfound);
app.use(errorHandeler);

mongoose.connect(MONGO_URL)
    .then(async () => 
    {
        console.log('Connected to MongoDB');
        
        if (NODE_ENV !== 'production') 
        {
            mongoose.set('autoIndex', true);
            await userModel.init();
            await OtpSchema.init();
            await ResetPasswordSchema.init();
        } 
        else 
        {
            mongoose.set('autoIndex', false);
        }
        
        app.listen(PORT, "0.0.0.0", () => {
            console.log(` Server is running on ${APP_BACKEND_URL}`);
        });
    })
    .catch((error) => 
    {
        console.error(' MongoDB connection error:', error);
        process.exit(1); // Stop the app if DB connection fails
    });