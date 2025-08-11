import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import googleLogin from './routes/googleLogin.js';
import games from './routes/games.js';
import logger from './middleware/logger.js';
import errorHandeler from './middleware/error.js';
import notfound from './middleware/notfound.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // ⬅️ Helps avoid CORS issues from frontend

app.use(logger);

app.use('/auth/google', googleLogin);
app.use('/games', games);

app.use(notfound);
app.use(errorHandeler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
