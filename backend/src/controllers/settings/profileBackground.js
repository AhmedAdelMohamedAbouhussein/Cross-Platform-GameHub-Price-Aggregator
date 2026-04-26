import { v2 as cloudinary } from "cloudinary";
import userModel from "../../models/User.js";
import config from "../../config/env.js";
import sharp from "sharp";

// Configure Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

export async function profileBackground(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const userId = req.session.userId;
        if (!userId) {
            return res.status(400).json({ error: "User ID not provided" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete old background if exists
        if (user.profileBackground) {
            try {
                // Extract public_id from URL
                const publicId = user.profileBackground
                    .split("/")
                    .pop()
                    .split(".")[0]; 

                await cloudinary.uploader.destroy(`profile_backgrounds/${publicId}`);
            } catch (err) {
                console.error("Failed to delete old background from Cloudinary:", err);
            }
        }

        // 1. Process background locally using sharp (Resize max 1920 + Compress + WebP)
        // Limits background resolution to 1080p max width while maintaining aspect ratio
        const processedBuffer = await sharp(req.file.buffer)
            .resize({
                width: 1920,
                withoutEnlargement: true, // Don't upscale small images
                fit: 'inside'
            })
            .webp({ quality: 80 })
            .toBuffer();

        // 2. Cloudinary upload
        const streamUpload = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "profile_backgrounds",
                        format: "webp",
                        transformation: [
                            // Ensure auto quality for delivery
                            { quality: "auto:eco", fetch_format: "auto" },
                        ],
                    },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );
                stream.end(fileBuffer);
            });
        };

        const result = await streamUpload(processedBuffer);

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { profileBackground: result.secure_url },
            { new: true }
        );

        res.json({
            message: "Profile background uploaded successfully",
            profileBackground: updatedUser.profileBackground,
        });
    } catch (err) {
        console.error("Cloudinary upload error:", err);
        next(err);
    }
}
