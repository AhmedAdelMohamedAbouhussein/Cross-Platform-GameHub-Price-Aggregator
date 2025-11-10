import express from 'express';
import {getTopSellers, getLandingPageImages, getOneGameDetails} from '../controllers/gamesController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Games
 *   description: API for fetching games, top sellers, landing page images, and game details
 */


/**
 * @swagger
 * /games/:
 *   get:
 *     summary: Catch-all route when category or game name is missing
 *     tags: [Games]
 *     responses:
 *       404:
 *         description: Category or Game name is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "category or Game name is required"
 */
router.get('/', (req, res) => {
    res.status(404).json({ error: 'category or Game name is required' });
});

/**
 * @swagger
 * /games/topselling:
 *   get:
 *     summary: Get top selling games from Steam
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: List of top selling games
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: array
 *                 items:
 *                   type: string
 *                   description: [Game header image URL, Game page link]
 *                 example: ["https://steamcdn-a.akamaihd.net/steam/apps/12345/header.jpg", "/games/Example Game"]
 *       404:
 *         description: Top sellers data not found
 *       500:
 *         description: Failed to fetch top selling games
 */
router.get('/topselling', getTopSellers);

/**
 * @swagger
 * /games/landingpage:
 *   get:
 *     summary: Get game images for the landing page
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: List of landing page game images
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 example: "https://example.com/gameImage.jpg"
 *       500:
 *         description: Failed to fetch game images
 */

router.get('/landingpage', getLandingPageImages);

/**
 * @swagger
 * /games/{gameName}:
 *   get:
 *     summary: Get detailed information about a game
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: gameName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the game to fetch details for
 *     responses:
 *       200:
 *         description: Detailed game info including stores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 12345
 *                   name:
 *                     type: string
 *                     example: "Example Game"
 *                   released:
 *                     type: string
 *                     example: "2024-01-01"
 *                   image:
 *                     type: string
 *                     example: "https://example.com/gameImage.jpg"
 *                   stores:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["Steam", "Epic Games"]
 *       400:
 *         description: Game name is required
 *       404:
 *         description: Game not found
 *       500:
 *         description: Failed to fetch game details
 */
router .get('/:gameName', getOneGameDetails);

export default router;