import express from 'express';
import { addUser } from '../controllers/users/create/addAndRestoreUsers.js';
import { getUserById, getUserIdByEmail, loginUser, getUserFriendList, getUserOwnedGames, getUserOwnedGame} from '../controllers/users/record/getUser.js';
import { updateUser } from '../controllers/users/update/updateUserInfo.js';
import { softDeletUser } from '../controllers/users/delete/softAndHardDeleteUser.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRequest:
 *       type: object
 *       required:
 *         - email
 *         - name
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           example: "john@example.com"
 *         password:
 *           type: string
 *           example: "StrongPassword123"
 *  
 *     UserCreatedResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "User signed up successfully, verification OTP sent"
 *         userId:
 *           type: string
 *           example: "64ac2f9a2b4e3c0021234567"
 *
 *     UserResponse:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "John Doe"
 *         publicID:
 *           type: string
 *           example: "JohnDoe#1234-ABCDE"
 *         email:
 *           type: string
 *           example: "john@example.com"
 *         bio:
 *           type: string
 *           example: "Gamer and developer"
 *         profileVisibility:
 *           type: string
 *           enum: ["public", "friends", "private"]
 *           example: "public"
 *         profilePicture:
 *           type: string
 *           example: "https://example.com/avatar.jpg"
 *         steamID:
 *           type: string
 *           example: "76561198000000000"
 *         xboxid:
 *           type: string
 *           example: "XBOX_USER_12345"
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: "john@example.com"
 *         password:
 *           type: string
 *           example: "StrongPassword123"
 *         rememberMe:
 *           type: boolean
 *           example: true
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Login successful redirecting to Landing Page......"
 *
 *     IdRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           example: "john@example.com"
 *
 *     UserIdResponse:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: "64ac2f9a2b4e3c0021234567"
 *
 *     MessageResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "User deleted successfully"
 *
 *     OwnedGamesResponse:
 *       type: object
 *       properties:
 *         ownedGames:
 *           type: object
 *           additionalProperties:
 *             type: object
 *           example:
 *             Steam:
 *               12345:
 *                 title: "Hollow Knight"
 *                 playtime: 60
 *             Xbox:
 *               67890:
 *                 title: "Ori and the Blind Forest"
 *                 playtime: 20
 *
 *     FriendsResponse:
 *       type: object
 *       properties:
 *         friends:
 *           type: object
 *           example:
 *             Steam:
 *               - "Friend1#1234"
 *               - "Friend2#5678"
 *             Xbox:
 *               - "FriendA#9999"
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API for managing users
 */

/**
 * @swagger
 * /api/users/adduser:
 *   post:
 *     summary: Add a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRequest'
 *     responses:
 *       201:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserCreatedResponse'
 *       400:
 *         description: Invalid input
 *       409:
 *         description: User already exists or associated with deleted account
 *       500:
 *         description: Server error
 */
router.post('/adduser', addUser);

/**
 * @swagger
 * /api/users/{publicID}:
 *   get:
 *     summary: Get a user by publicID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: publicID
 *         required: true
 *         schema:
 *           type: string
 *         description: Public ID of the user
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:publicID', getUserById);

/**
 * @swagger
 * /api/users/getuseridbyemail:
 *   post:
 *     summary: Get user ID by email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IdRequest'
 *     responses:
 *       200:
 *         description: User ID found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserIdResponse'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

router.post('/getuseridbyemail', getUserIdByEmail);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: User login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       409:
 *         description: Account requires verification or is deleted
 *       404:
 *         description: Invalid email
 */
router.post('/login', loginUser);

/**
 * @swagger
 * /api/users/ownedgames:
 *   post:
 *     summary: Get all owned games for a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "64ac2f9a2b4e3c0021234567"
 *     responses:
 *       200:
 *         description: List of owned games
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OwnedGamesResponse'
 *       404:
 *         description: User not found
 */
router.post('/ownedgames', getUserOwnedGames);

/**
 * @swagger
 * /api/users/ownedgames/{platform}/{id}:
 *   post:
 *     summary: Get a specific owned game
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *         description: Platform name (e.g., Steam, Xbox)
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "64ac2f9a2b4e3c0021234567"
 *     responses:
 *       200:
 *         description: Owned game found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 game:
 *                   type: object
 *                   example:
 *                     title: "Hollow Knight"
 *                     hoursPlayed: 55
 *                     platform: "Steam"
 *       404:
 *         description: Game or user not found
 */
router.post('/ownedgames/:platform/:id', getUserOwnedGame);

/**
 * @swagger
 * /api/users/friendlist:
 *   post:
 *     summary: Get a user's friend list
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               publicID:
 *                 type: string
 *                 example: "JohnDoe#1234-ABCDE"
 *     responses:
 *       200:
 *         description: Friend list returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FriendsResponse'
 *       404:
 *         description: User not found
 */
router.post('/friendlist', getUserFriendList);


/**
 * @swagger
 * /api/users/update/{email}:
 *   put:
 *     summary: Update user info
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already exists or belongs to deleted account
 */

router.put('/update/:email', updateUser);

/**
 * @swagger
 * /api/users/delete/{email}:
 *   delete:
 *     summary: Soft delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: User not found
 */
router.delete('/delete/:email', softDeletUser);

export default router;