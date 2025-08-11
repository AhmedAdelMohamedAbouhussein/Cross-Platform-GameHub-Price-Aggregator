import express from 'express';
import { OAuth2Client, } from 'google-auth-library';
import dotenv from 'dotenv';
import { getAccessToken, getRefreshToken } from '../controllers/googleAuthController.js';

dotenv.config();

const router = express.Router();

const CI = process.env.GOOGLE_CLIENT_ID;
const CS = process.env.GOOGLE_CLIENT_SECRET;

const oAuth2Client = new OAuth2Client( CI, CS, 'postmessage');

router.post('/access-token', getAccessToken);

router.post('/refresh-token', getRefreshToken);

export default router;