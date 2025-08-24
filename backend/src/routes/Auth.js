import express from 'express';
import { googleLogin , googleSignup } from '../controllers/Auth/googleAuthController.js';
import { authUser } from '../controllers/Auth/authUser.js'
import { logoutUser } from '../controllers/Auth/logoutUser.js'
import { resetPassword } from '../controllers/Auth/resetPassword.js'

const router = express.Router();

router.post('/google/login', googleLogin);
router.post('/google/signup', googleSignup);

router.get('/authUser', authUser)
router.post('/logout', logoutUser);
router.post('/resetpassword', resetPassword)

export default router;