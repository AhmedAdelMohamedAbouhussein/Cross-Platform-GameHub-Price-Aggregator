import userModel from '../models/User.js'
import express from 'express';
import { addFriends } from '../controllers/Friends/addFriends.js';
import { acceptFriends } from '../controllers/Friends/acceptFriends.js';
import { rejectFriends } from '../controllers/Friends/rejectFriends.js';
import { removeFriends } from '../controllers/Friends/removeFriends.js';


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Friends
 *   description: API for managing friend requests and friendships
 */


/**
 * @swagger
 * /friends/add/{friendId}:
 *   post:
 *     summary: Send a friend request
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: Public ID of the user to send request to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicID
 *             properties:
 *               publicID:
 *                 type: string
 *                 example: "CurrentUser#1234"
 *     responses:
 *       200:
 *         description: Friend request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Friend request sent!"
 *       400:
 *         description: Invalid request (self add or already sent)
 *       404:
 *         description: User not found
 */
router.post("/add/:friendId", addFriends);

/**
 * @swagger
 * /friends/accept/{friendId}:
 *   post:
 *     summary: Accept a pending friend request
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: Public ID of the user whose request is being accepted
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicID
 *             properties:
 *               publicID:
 *                 type: string
 *                 example: "CurrentUser#1234"
 *     responses:
 *       200:
 *         description: Friend request accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Friend request accepted!"
 *       400:
 *         description: No pending request found
 *       404:
 *         description: One or both users not found
 */
router.post("/accept/:friendId", acceptFriends);

/**
 * @swagger
 * /friends/reject/{friendId}:
 *   post:
 *     summary: Reject a pending friend request
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: Public ID of the user whose request is being rejected
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicID
 *             properties:
 *               publicID:
 *                 type: string
 *                 example: "CurrentUser#1234"
 *     responses:
 *       200:
 *         description: Friend request rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Friend request rejected"
 *       400:
 *         description: No pending request found
 *       404:
 *         description: One or both users not found
 */
router.post("/reject/:friendId", rejectFriends);

/**
 * @swagger
 * /friends/remove/{friendId}:
 *   post:
 *     summary: Remove an existing friend
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: Public ID of the friend to remove
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicID
 *             properties:
 *               publicID:
 *                 type: string
 *                 example: "CurrentUser#1234"
 *     responses:
 *       200:
 *         description: Friend removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Friend removed successfully"
 *       400:
 *         description: Friendship not found
 *       404:
 *         description: One or both users not found
 */
router.post("/remove/:friendId", removeFriends);

export default router;