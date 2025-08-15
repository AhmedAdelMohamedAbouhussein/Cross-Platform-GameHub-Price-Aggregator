import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import googleLogin from './routes/googleLogin.js';
import games from './routes/games.js';
import steam from './routes/steam.js';

import logger from './middleware/logger.js';
import errorHandeler from './middleware/error.js';
import notfound from './middleware/notfound.js';

import userModel from './models/User.js'

dotenv.config();
const app = express();
const PORT = process.env.PORT;
const MONGO_URL = process.env.LOCAL_MONGO_URL;

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // ⬅️ Helps avoid CORS issues from frontend

app.use(logger);

app.use('/auth/google', googleLogin);
app.use('/games', games);
app.use('/steam', steam)

app.post('/api/users', async (req, res, next) => {
    try 
    {
        const user = await userModel.create(req.body);        
        res.status(200).json({message: "User added successfully"});
    } 
    catch (error) 
    {
        console.error(error); 
        const err = new Error("Wasn't able to add user");
        err.status = 400; 
        next(err);
    }
});
app.get('/api/users', async (req, res, next) => {
    try 
    {
        const users = await userModel.find();        
        res.status(200).json(users);
    } 
    catch (error) 
    {
        console.error(error);
        const err = new Error("Wasn't able to get user list");
        next(err);
    }
})

app.use(notfound);
app.use(errorHandeler);

mongoose.connect(MONGO_URL)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(` Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error(' MongoDB connection error:', error);
        process.exit(1); // Stop the app if DB connection fails
    });