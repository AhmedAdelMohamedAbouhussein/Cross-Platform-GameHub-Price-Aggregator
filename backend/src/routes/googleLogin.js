import express from 'express';
import { getAccessToken, getRefreshToken } from '../controllers/googleAuthController.js';

const router = express.Router();

router.post('/access-token', getAccessToken);

router.post('/refresh-token', getRefreshToken);

export default router;