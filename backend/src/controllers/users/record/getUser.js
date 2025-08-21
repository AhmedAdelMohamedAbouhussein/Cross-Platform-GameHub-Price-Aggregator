import userModel from "../../../models/User.js";
import config from '../../../config.js'

const APP_BACKEND_URL = config.appUrl;

// @desc   Get user by ID
// @route  GET /api/users/getbyid/:id
export const getUserByID = async (req, res, next) => 
{
    try 
    {
        const id = req.params.id;
        if (!id) 
        {
            const err = new Error("User ID parameter is required");
            err.status = 400;
            return next(err);
        }

        const user = await userModel.findOne({ isDeleted: false, _id: id });
        if (!user) 
        {
            const err = new Error("User not found");
            err.status = 404;
            return next(err);
        }

        res.status(200).json(user);
    } 
    catch (error) 
    {
        console.error(error);
        const err = new Error("Wasn't able to get user");
        next(err);
    }
};

// @desc   Login user
// @route  POST /api/users/login
export const loginUser = async (req, res, next) => 
{
    try 
    {
        const email = req.body.email; 
        const password = req.body.password;
        const rememberMe = Boolean(req.body.rememberMe);

        if (!email || !password) 
        {
        const err = new Error("Email and password are required");
        err.status = 400;
        return next(err);
        }

        const ONE_DAY = 1000 * 60 * 60 * 24;
        const SEVEN_DAYS = ONE_DAY * 7;
        
        // Check active user
        const user = await userModel.findOne({ email, isDeleted: false }).select('+password');

        if (user) 
        {
            const isMatch = await user.comparePassword(password);
            if (!isMatch) 
            {
                const err = new Error("Invalid Password");
                err.status = 401;
                return next(err);
            }
            
            //req.session.isLoggedIn = true; //may use layter if i set cookies and sessions to guests
            req.session.userId = user._id;
            //req.session.role = user.role; //may use later if i add admin  

            req.session.cookie.maxAge = rememberMe ? SEVEN_DAYS : ONE_DAY;

            return req.session.save(err => 
            {
                if (err) 
                {
                    console.error("Session save error:", err);
                    const err = new Error("Failed to save session");
                    return next(err);
                }
                return res.status(200).json({
                    message: "Login successful redirecting to Landing Page......"
                });
            });
        }

        // Check deleted user
        const deletedUser = await userModel.findOne({ email, isDeleted: true });
        if (deletedUser) 
        {
            const isMatch = await deletedUser.comparePassword(password);
            if (!isMatch) 
            {
                const err = new Error("Invalid Password");
                err.status = 401;
                return next(err);
            }

            return res.status(409).json({
                message:
                    "This email is associated with a deleted account. Would you like to restore your old account or permanently delete it?",
                restoreLink: `${APP_BACKEND_URL}/api/users/${email}/restore`,
                permanentDelete: `${APP_BACKEND_URL}/api/users/${email}/permanentDelete`,
            });
        }

        // No user found at all
        const err = new Error("Invalid Email");
        err.status = 404;
        return next(err);
    }
    catch (error) 
    {
        console.error(error);
        const err = new Error("Error when trying to login");
        return next(err);
    }
};
