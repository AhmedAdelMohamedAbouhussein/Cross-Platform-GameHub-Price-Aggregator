import express from 'express';
import cors from 'cors';

import corsOptions from './config/cors.js';
import sessionMiddleware from './config/session.js';

import redisClient from './config/redis.js';

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


// ── redis ──────────────────────────────────────────────────────────

await redisClient.connect();

// ── Core middleware ──────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors(corsOptions));
app.use(logger);
app.use(sessionMiddleware);

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
