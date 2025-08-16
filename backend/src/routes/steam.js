import express from 'express';
import { getallsteaminfo } from '../controllers/allSteamInfo.js';
import { syncWithSteam } from '../controllers/sync.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.status(404).json({ error: 'category or Game name is required' });
});

router.get('/sync', syncWithSteam)
router.get('/getinfo', getallsteaminfo)


export default router;