import userModel from "../models/User.js";
import PasswordResetToken from "../models/PasswordResetToken.js";

// @desc   Reset password using token
// @route  POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
    try 
    {
        const { userId, token, newPassword } = req.body;

        // Validate password with regex
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(newPassword)) 
        {
            return res.status(400).json({
            message: "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, and one number.",
            });
        }

        const user = await userModel.findById(userId);
        if (!user || user.isDeleted === true) 
        {
            return res.status(404).json({ message: "User not found or inactive." });
        }

        // Find token doc
        const tokenDoc = await PasswordResetToken.findOne({ userId }).sort({ createdAt: -1 });
        if (!tokenDoc) 
        {
            return res.status(400).json({ message: "Invalid or expired reset token." });
        }
        else
        {
            const now = new Date();
            const expiresAt = new Date(tokenDoc.createdAt.getTime() + 5 * 60000);
            if (now > expiresAt) 
            {
                await PasswordResetToken.deleteOne({ _id: tokenDoc._id });
                const error = new Error("reset token, please request a new one.");
                error.status = 400;
                return next(error);
            }
        }


        // Compare provided token with hashed one
        const isValid = await tokenDoc.compareToken(token);
        if (!isValid) 
        {
            return res.status(400).json({ message: "Invalid reset token." });
        }

        // Update user password
        await userModel.findByIdAndUpdate(userId, { $set: { password: newPassword } });

        // Mark token as used
        await PasswordResetToken.findByIdAndDelete(tokenDoc._id);

        res.status(200).json({ message: "Password reset successful." });
    } 
    catch (err) 
    {
        console.error("Reset password error:", err);
        res.status(500).json({ message: "Server error during password reset." });
    }
};
