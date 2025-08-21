import express from 'express';
import { googleLogin , googleSignup } from '../controllers/Auth/googleAuthController.js';
import { authUser } from '../controllers/Auth/authUser.js'
import { logoutUser } from '../controllers/Auth/logoutUser.js'

const router = express.Router();

router.post('/google/login', googleLogin);
router.post('/google/signup', googleSignup);

router.get('/authUser', authUser)
router.post('/logout', logoutUser);

export default router;