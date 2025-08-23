import express from 'express';

import { sendOtp } from '../controllers/nodeMailer/sendOtp.js';
import { verifyOtp } from '../controllers/nodeMailer/verifyOtp.js';

const router = express.Router();

router.post('/sendotp', sendOtp);
router.post('/verifyOtp', verifyOtp);

export default router;