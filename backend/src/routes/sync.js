import express from 'express';
import { syncWithSteam } from '../controllers/sync.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.status(404).json({ error: 'specify what to sync' });
});

router.get('/steam', syncWithSteam)

export default router;