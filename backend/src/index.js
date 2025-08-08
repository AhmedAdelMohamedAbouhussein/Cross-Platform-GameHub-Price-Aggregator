import express from 'express';
import dotenv from 'dotenv';
import posts from './routes/posts.js';
import googleLogin from './routes/googleLogin.js';
import games from './routes/games.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// ✅ MIDDLEWARE (you should add this globally too)
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// ✅ OPTIONAL: Allow CORS globally
import cors from 'cors';
app.use(cors()); // ⬅️ Helps avoid CORS issues from frontend


app.use('/api/posts', posts);
app.use('/auth/google', googleLogin);
app.use('/games', games)


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
