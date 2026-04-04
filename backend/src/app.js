import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';

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

const app = express();

// ── Core middleware ──────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
}));

app.use(logger);

app.use(session({
    secret: config.sessionSecret || 'test-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: config.mongoLocal || 'mongodb://localhost/test',
        collectionName: 'sessions'
    }),
    cookie: {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: config.nodeEnv === "production" ? "none" : "lax",
    }
}));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', Auth);
app.use('/api/games', games);
app.use('/api/users', usersCRUD);
app.use('/api/sync', sync);
app.use('/api/mail', NodeMailer);
app.use('/api/friends', Friends);
app.use('/api/setting', Settings);
app.use('/api/refresh', Refresh);

// ── Error-handling middleware ─────────────────────────────────────────────────
app.use(notfound);
app.use(errorHandeler);

export default app;
