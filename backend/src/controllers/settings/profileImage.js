import { v2 as cloudinary } from "cloudinary";
import userModel from "../../models/User.js";
import config from "../../config.js";

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

        const userId = req.body.userId;
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
                    .split(".")[0]; // assumes URL ends with "something.jpg"

                await cloudinary.uploader.destroy(`profile_pics/${publicId}`);
            } catch (err) {
                console.error("Failed to delete old image from Cloudinary:", err);
            }
        }

        // Cloudinary upload
        const streamUpload = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "profile_pics",
                        format: "jpg",
                        transformation: [
                            { width: 300, height: 300, crop: "thumb", gravity: "face" },
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
