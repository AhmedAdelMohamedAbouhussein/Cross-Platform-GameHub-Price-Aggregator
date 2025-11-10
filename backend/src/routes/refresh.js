import express from 'express';
import { refreshOwnedGames } from "../controllers/refresh.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Refresh
 *   description: Endpoints for handling refreshes of user data
 */

/**
 * @swagger
 * /refresh/refreshOwnedGames:
 *   post:
 *     summary: Refresh a user's owned games from Steam
 *     tags: [Refresh]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to refresh games for
 *               steamId:
 *                 type: string
 *                 description: Optional Steam ID of the user (required if syncing Steam games)
 *     responses:
 *       200:
 *         description: Owned games refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Owned games refreshed successfully
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Failed to refresh owned games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to refresh owned games
 */

router.post('/refreshOwnedGames', refreshOwnedGames);

export default router;