import userModel from '../models/User.js'
import express from 'express';
import { addFriends } from '../controllers/Friends/addFriends.js';
import { acceptFriends } from '../controllers/Friends/acceptFriends.js';
import { rejectFriends } from '../controllers/Friends/rejectFriends.js';
import { removeFriends } from '../controllers/Friends/removeFriends.js';


const router = express.Router();


router.post("/add/:friendId", addFriends);

router.post("/accept/:friendId", acceptFriends);

router.post("/reject/:friendId", rejectFriends);

router.post("/remove/:friendId", removeFriends);


export default router;