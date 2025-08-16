import userModel from '../../../models/User.js'

// @desc   
// @route  PATCH /api/users/update/:email
export const updateUser = async (req, res, next) => 
{
    try 
    {
        const email = req.params.email;
        if (!email) 
        {
            return res.status(400).json({ message: "Email params parameter is required" });
        }

        // If user is trying to update the email
        if (req.body.email) 
        {
            const activeUser  = await userModel.findOne({ email: req.body.email });
            if (activeUser  && activeUser .email !== email) 
            {
                const err = new Error("Email already exists");
                err.status = 409;
                return next(err);
            }
            // Check deleted users
            const deletedUser = await userModel.findOne({ email: req.body.email, isDeleted: true });
            if (deletedUser) 
            {
                return res.status(409).json({message: "This email belongs to a deleted account. Would you like to restore the deleted account?", restoreLink: `/api/users/${req.body.email}/restore`});
            }
        }
        const result = await userModel.updateOne({ email: email },{ $set: req.body });

        if (result.matchedCount === 0) 
        {
            const err = new Error("User not found or update failed");
            err.status = 404;
            return next(err);
        }

        const updatedUser = await userModel.findOne({email: req.body.email || email});

        res.status(200).json(updatedUser);
    } 
    catch (error) 
    {
        console.error(error);
        const err = new Error("Error when trying to update user");
        next(err);
    }
};