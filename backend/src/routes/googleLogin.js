import express from 'express';
import { google } from 'googleapis';
import { OAuth2Client, UserRefreshClient } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const oAuth2Client = new OAuth2Client( process.env.CLIENT_ID, process.env.CLIENT_SECRET, 'postmessage',);

router.post('/', async (req, res, next) => 
{
    try 
    {
        const { tokens } = await oAuth2Client.getToken(req.body.code); // exchange code for tokens
        oAuth2Client.setCredentials(tokens); // Set the credentials
        const oauth2 = google.oauth2({
            auth: oAuth2Client,
            version: 'v2',
        });
        // Fetch user info
        const userInfoResponse = await oauth2.userinfo.get();
        const userInfo = userInfoResponse.data;

        console.log('User Info:', userInfo);
        console.log('Tokens:', tokens);

        // Send tokens + user info to frontend
        res.json({ tokens, userInfo }); // ✅ Correct

    } 
    catch (error) 
    {
        const err = new Error('Error during Google login:');
        next(err); 
    }
});

router.post('/refresh-token', async (req, res, next) => {
    try 
    {
        const user = new UserRefreshClient(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            req.body.refreshToken,
        );
        const { credentials } = await user.refreshAccessToken(); // obtain new tokens
        res.json(credentials);
    } 
    catch (error) 
    {
        const err = new Error('Error refreshing Google token:');
        next(err);
    }
});

export default router;