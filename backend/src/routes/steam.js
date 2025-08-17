import express from 'express';
import { getallsteaminfo } from '../controllers/allSteamInfo.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.status(404).json({ error: 'category or Game name is required' });
});

router.get('/getinfo', getallsteaminfo)


export default router;