import userModel from "../../../models/User.js";
import config from '../../../config.js'

const APP_BACKEND_URL = config.appUrl;
const APP_FRONTEND_URL = config.frontendUrl;


// @desc   Get user by ID
// @route  POST /api/users/getuseridbyemail
export const getUserIdByEmail = async (req, res, next) => 
{
    try 
    {
        const email = req.body.email;
        if (!email) 
        {
            const err = new Error("User Email is required");
            err.status = 400;
            return next(err);
        }

        const user = await userModel.findOne({ email: email });
        if (!user) 
        {
            const err = new Error("User email not found");
            err.status = 404;
            return next(err);
        }

        res.status(200).json({userId: user._id});
    } 
    catch (error) 
    {
        console.error(error);
        const err = new Error("Wasn't able to get user");
        next(err);
    }
};

const ONE_DAY = 1000 * 60 * 60 * 24;
const SEVEN_DAYS = ONE_DAY * 7;

export async function authenticateUser(email, password, rememberMe) {
    if (!email || !password) 
    {
        throw { status: 400, message: "Email and password are required" };
    }

    // Check active user
    const user = await userModel.findOne({ email, isDeleted: false }).select('+password');
    if (user) 
    {
        const isMatch = await user.comparePassword(password);
        if (!isMatch) throw { status: 401, message: "Invalid Password" };

        if (user.isVerified === false) 
        {
            return {
                status: 409,
                data: {
                    message: "Please verify your account to login",
                    verifyLink: `/verify?userId=${user._id}&email=${encodeURIComponent(user.email)}&purpose=email_verification`,
                }
            };
        }

        return {
            status: 200,
            data: {userId: user._id, message: "User logged in successfully"}
        };
    }

    // Check deleted user
    const deletedUser = await userModel.findOne({ email, isDeleted: true });
    if (deletedUser) 
    {
        return {
            status: 409,
            data: {
                message: "This email is associated with a deleted account. Would you like to restore or permanently delete it?",
                restoreLink: `/verify?userId=${deletedUser._id}&email=${encodeURIComponent(deletedUser.email)}&purpose=restore_account`,
                permanentDelete: `/verify?userId=${deletedUser._id}&email=${encodeURIComponent(deletedUser.email)}&purpose=permanently_delete_account`,
            }
        };
    }

    throw { status: 404, message: "Invalid Email" };
}


// @desc   Login user
// @route  POST /api/users/login
export const loginUser = async (req, res, next) => 
{
    try
    {
        const { email, password, rememberMe } = req.body;
        const result = await authenticateUser(email, password, rememberMe);

        if (result.status === 200) 
        {
            const { userId } = result.data;
            req.session.userId = userId;
            req.session.cookie.maxAge = rememberMe ? SEVEN_DAYS : ONE_DAY;

            return req.session.save(err => 
            {
                if (err) 
                { 
                    console.error("Session save error:", err); 
                    const err = new Error("Failed to save session"); 
                    return next(err); 
                }
                return res.status(200).json({ message: "Login successful redirecting to Landing Page......" });
            });
        } 
        else 
        {
            return res.status(result.status).json(result.data);
        }
    } 
    catch (error) 
    {
        console.error(error);
        return next(error);
    }
};

// @desc   get user owned games
// @route  POST /api/users/ownedgames
export const getUserOwnedGames = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId).select("ownedGames");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Convert Maps to plain objects
    const ownedGames = {};
    if (user.ownedGames) {
      for (const [platform, gamesMap] of user.ownedGames.entries()) {
        ownedGames[platform] = Object.fromEntries(gamesMap);
      }
    }

    res.status(200).json({ ownedGames });
  } catch (err) {
    next(err);
  }
};


// @desc   get user friend list
// @route  POST /api/users/friendlist
export const getUserFriendList = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId).select("friends");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Convert Map -> plain object
    const friends = {};
    if (user.friends) 
    {
      for (const [platform, friendArray] of user.friends.entries()) 
    {
        friends[platform] = friendArray; // friendArray is already plain objects
      }
    }

    res.status(200).json({ friends });
  } catch (err) {
    next(err);
  }
};

// @desc   Get a specific owned game
// @route  POST /api/users/ownedgames/:platform/:id
export const getUserOwnedGame = async (req, res, next) => {
  try {
    const { userId } = req.body; // comes from frontend
    const { platform, id } = req.params; // platform + gameId in URL

    const user = await userModel.findById(userId).select("ownedGames");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ownedGames is a Map<platform, Map<gameId, gameObj>>
    const platformGames = user.ownedGames?.get(platform);
    if (!platformGames) {
      return res.status(404).json({ message: `No games found for platform ${platform}` });
    }

    const game = platformGames.get(id);
    if (!game) {
      return res.status(404).json({ message: `Game with id ${id} not found on ${platform}` });
    }

    res.status(200).json({ game });
  } catch (err) {
    next(err);
  }
};

