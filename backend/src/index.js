import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import googleLogin from './routes/googleLogin.js';
import games from './routes/games.js';
import steam from './routes/steam.js';
import sync from './routes/sync.js'
import usersCRUD from './routes/users.js' 

import logger from './middleware/logger.js';
import errorHandeler from './middleware/error.js';
import notfound from './middleware/notfound.js';

import userModel from './models/User.js'

dotenv.config();
const app = express();
const PORT = process.env.PORT;
const MONGO_URL = process.env.LOCAL_MONGO_URL;

//middleware
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));
app.use(cors()); // ⬅️ Helps avoid CORS issues from frontend
app.use(logger);

//routes
app.use('/auth/google', googleLogin);
app.use('/games', games);
app.use('/steam', steam);
app.use('/api/users', usersCRUD);
app.use('/sync', sync);

//middleware
app.use(notfound);
app.use(errorHandeler);

mongoose.connect(MONGO_URL)
    .then(async () => 
    {
        console.log('Connected to MongoDB');
        
        if (process.env.NODE_ENV !== 'production') 
        {
            mongoose.set('autoIndex', true);
            await userModel.init();
        } 
        else 
        {
            mongoose.set('autoIndex', false);
        }
        
        app.listen(PORT, () => {
            console.log(` Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => 
    {
        console.error(' MongoDB connection error:', error);
        process.exit(1); // Stop the app if DB connection fails
    });