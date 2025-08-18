import { google } from 'googleapis';
import { UserRefreshClient, OAuth2Client } from 'google-auth-library';
import config from '../config.js'

const CI = config.google.clientId;
const CS = config.google.clientSecret;
const oAuth2Client = new OAuth2Client( CI, CS, 'postmessage');

// @desc  get access token from Google
// @route  POST /auth/google/access-token
export const getAccessToken = async (req, res, next) => 
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
        console.error("Google login error:", error.response?.data || error.message || error);
        return res.status(500).json({
            message: "Error during Google login",
            error: error.response?.data || error.message
        });
    }
}

// @desc  get refresh token from Google
// @route  POST /auth/google/refresh-token
export const getRefreshToken = async (req, res, next) => {
    try 
    {
        const client = new UserRefreshClient(CI, CS, req.body.refreshToken);
        await client.refreshAccessToken(); // refresh the access token
        res.json(client.credentials);     // contains the new access token
    } 
    catch (error) 
    {
        console.error('Error refreshing Google token:', error);
        const err = new Error('Error refreshing Google token:');
        next(err);
    }
}