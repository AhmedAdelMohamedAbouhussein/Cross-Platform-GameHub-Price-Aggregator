import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore  from 'connect-mongo';
import config from './config.js'

import googleLogin from './routes/googleLogin.js';
import games from './routes/games.js';
import steam from './routes/steam.js';
import sync from './routes/sync.js'
import usersCRUD from './routes/users.js' 

import logger from './middleware/logger.js';
import errorHandeler from './middleware/error.js';
import notfound from './middleware/notfound.js';

import userModel from './models/User.js'

const app = express();
const PORT = config.port;
const MONGO_URL = config.mongoLocal;
const APP_BACKEND_URL = config.appUrl;
const NODE_ENV = config.nodeEnv;
const SESSION_SECRET = config.sessionSecret;

//middleware
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // ⬅️ Helps avoid CORS issues from frontend //TODO
app.use(logger);
app.use(session({   // Session middleware
    secret: SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGO_URL,
        collectionName: 'sessions',
        //ttl: 14 * 24 * 60 * 60, // 14 days
    }),
    cookie: 
    {
        httpOnly: true,
        //maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
}));

//routes
app.use('/auth/google', googleLogin);
app.use('/games', games);
app.use('/steam', steam);
app.use('/api/users', usersCRUD);
app.use('/sync', sync);

app.use('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to log out');
        }

        // Clear the cookie in the browser
        res.clearCookie('connect.sid'); // or whatever your session cookie name is
        res.json({ success: true, message: 'Logged out successfully' });
    });
});


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