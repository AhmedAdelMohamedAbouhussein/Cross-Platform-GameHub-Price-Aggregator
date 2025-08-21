import config from '../../config.js'

// @desc   Logout user
// @route  POST /api/auth/logout
export const logoutUser = (req, res, next) => 
{
    req.session.destroy(err => {
        if (err) 
        {
            console.error(err);
            const error = new Error('Failed to log out');
            return next(error);
        }

        res.clearCookie('connect.sid', 
        {
            httpOnly: true,
            secure: config.nodeEnv === "production", // secure only in prod
            sameSite: config.nodeEnv === "production" ? "none" : "lax",
        });

        res.json({ success: true, message: 'Logged out successfully' });
    });
};