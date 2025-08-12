import { google } from 'googleapis';
import { UserRefreshClient, OAuth2Client } from 'google-auth-library';

// @desc  get access token from Google
// @route  POST /auth/google/access-token

const CI = process.env.GOOGLE_CLIENT_ID;
const CS = process.env.GOOGLE_CLIENT_SECRET;

const oAuth2Client = new OAuth2Client( CI, CS, 'postmessage');

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
        const err = new Error('Error during Google login:');
        next(err); 
    }
}

// @desc  get refresh token from Google
// @route  POST /auth/google/refresh-token
export const getRefreshToken = async (req, res, next) => {
    try 
    {
        const user = new UserRefreshClient(CI, CS, req.body.refreshToken);
        const { credentials } = await user.refreshAccessToken(); // obtain new tokens
        res.json(credentials);
    } 
    catch (error) 
    {
        const err = new Error('Error refreshing Google token:');
        next(err);
    }
}