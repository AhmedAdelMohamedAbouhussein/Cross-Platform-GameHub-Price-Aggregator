import express from 'express';
import dotenv from 'dotenv';
import {getTopSellers, getLandingPageImages, getGameDetails} from '../controllers/gamesController.js';

dotenv.config();
const router = express.Router();

router.get('/', (req, res) => {
    res.status(400).json({ error: 'category or Game name is required' });
});


router.get('/topselling', getTopSellers);

router.get('/landingpage', getLandingPageImages);

router .get('/:gameName', getGameDetails);

export default router;