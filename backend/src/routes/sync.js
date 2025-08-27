import express from 'express';
import { syncWithSteam, steamReturn, syncWithXbox, xboxReturn } from '../controllers/sync.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.status(404).json({ error: 'specify what to sync' });
});

router.get('/steam', syncWithSteam)
router.get('/steam/return', steamReturn)

router.get("/xbox",syncWithXbox )
router.get("/xbox/return", xboxReturn)

export default router;