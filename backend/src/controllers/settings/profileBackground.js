import { v2 as cloudinary } from "cloudinary";
import userModel from "../../models/User.js";
import config from "../../config/env.js";

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

        // Cloudinary upload
        const streamUpload = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "profile_backgrounds",
                        format: "jpg",
                        transformation: [
                            // 1920x1080 standard background resolution
                            { width: 1920, height: 1080, crop: "limit", quality: "auto:eco" },
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

        const result = await streamUpload(req.file.buffer);

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
