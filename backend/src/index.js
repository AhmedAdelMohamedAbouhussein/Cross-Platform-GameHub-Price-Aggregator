import express from 'express';
import dotenv from 'dotenv';
import posts from './routes/posts.js';
import googleLogin from './routes/googleLogin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use('/api/posts', posts);
app.use('/auth/google', googleLogin);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
