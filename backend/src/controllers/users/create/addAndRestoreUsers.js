import userModel from '../../../models/User.js'

// @desc  
// @route  POST /api/users/adduser
export const addUser = async (req, res, next) => 
{
    try 
    {
        const { email, name } = req.body;

        if (!email || !name) 
        {
            const err = new Error("Email and name are required");
            err.status = 400;
            return next(err);
        }

        // Check if an active user already exists
        const activeUser = await userModel.findOne({ email, isDeleted: false });
        if (activeUser) 
        {
            const err = new Error("User with this email already exists");
            err.status = 409;
            return next(err);
        }

        // Check if a deleted user exists
        const deletedUser = await userModel.findOne({ email, isDeleted: true });
        if (deletedUser) 
        {
            // Send a friendly message suggesting restore
            return res.status(409).json( {message: "This email is associated with a deleted account. Would you like to restore it?", restoreLink: `/api/users/${email}/restore`, permanentdelete: `/api/users/${email}/restore`});
        }

        // Otherwise, create new user
        const newUser = await userModel.create(req.body);
        res.status(201).json(newUser);

    } 
    catch (error)
    {
        console.error(error);
        const err = new Error("Wasn't able to add user");
        err.status = 400;
        next(err);
    }
}

// @desc  
// @route  PATCH /api/users/:email/restore
export const restoreUser = async (req, res, next) => 
{
    try {
        const { email } = req.params;

        const deletedUser = await userModel.findOne({ email, isDeleted: true });
        if (!deletedUser) 
        {
            return res.status(404).json({ message: "Deleted user not found" });
        }

        const restoredUser = await userModel.findOneAndUpdate({email: email },{ $set: { isDeleted: false, ...req.body } },{ new: true });

        res.status(200).json( {message: "User restored successfully", user: restoredUser});
    } 
    catch (error) 
    {
        console.error(error);
        next(new Error("Error when trying to restore user"));
    }
};