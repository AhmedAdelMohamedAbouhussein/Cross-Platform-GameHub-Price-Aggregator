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

export async function profileImage(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const userId = req.session.userId;
        if (!userId) {
            return res.status(400).json({ error: "User ID not provided" });
        }

        // Find the user first
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete old picture if exists
        if (user.profilePicture) {
            try {
                // Extract public_id from URL
                const publicId = user.profilePicture
                    .split("/")
                    .pop()
                    .split(".")[0]; 

                await cloudinary.uploader.destroy(`profile_pics/${publicId}`);
            } catch (err) {
                console.error("Failed to delete old image from Cloudinary:", err);
            }
        }

        // 1. Process image locally using sharp (Resize + Compress + WebP)
        // This reduces the upload size significantly BEFORE it hits Cloudinary
        const processedBuffer = await sharp(req.file.buffer)
            .resize(300, 300, {
                fit: 'cover',
                position: 'centre'
            })
            .webp({ quality: 80 }) // WebP is ~30% smaller than JPG
            .toBuffer();

        // 2. Cloudinary upload
        const streamUpload = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "profile_pics",
                        format: "webp",
                        transformation: [
                            // Use auto quality and format for delivery optimization
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
            { profilePicture: result.secure_url },
            { new: true }
        );

        res.json({
            message: "Profile image uploaded successfully",
            profilePicture: updatedUser.profilePicture,
        });
    } catch (err) {
        console.error("Cloudinary upload error:", err);
        next(err);
    }
}
