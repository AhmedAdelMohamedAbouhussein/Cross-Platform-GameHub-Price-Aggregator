// config/session.js
import session from 'express-session';
import MongoStore from 'connect-mongo';
import config from './env.js';

const sessionMiddleware = session({
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
});

export default sessionMiddleware;