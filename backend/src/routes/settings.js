import express from "express";
import upload from "../middleware/multer.js";
import { profileImage } from "../controllers/settings/profileImage.js";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: User settings endpoints, including profile image upload
 */

/**
 * @swagger
 * /settings/profileimage:
 *   post:
 *     summary: Upload or update a user's profile image
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *               userId:
 *                 type: string
 *                 description: MongoDB ID of the user
 *             required:
 *               - profileImage
 *               - userId
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile image uploaded successfully"
 *                 profilePicture:
 *                   type: string
 *                   description: URL of the uploaded profile picture
 *                   example: "https://res.cloudinary.com/your-cloud-name/image/upload/v123456/profile_pics/abc123.jpg"
 *       400:
 *         description: Missing file or userId
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error during upload
 */
router.post("/profileimage", upload.single("profileImage"), profileImage);

export default router;
