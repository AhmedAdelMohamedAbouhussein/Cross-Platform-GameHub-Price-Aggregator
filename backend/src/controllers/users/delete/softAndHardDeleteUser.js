import userModel from '../../../models/User.js'

// @desc   
// @route  PATCH /api/users/delete/:email
export const softDeletUser = async (req, res, next) => 
{
    try
    {
        const email = req.params.email;
        if (!email) 
        {
            return res.status(400).json({ message: "Email params parameter is required" });
        }
        const findUser = await userModel.findOne({email: email});
        
        if(!findUser)
        {
            const error = new Error("User Email doesnt exist");
            error.status = 404;
            return next(error);
        }

        await userModel.updateOne({email: email}, {isDeleted: true});
        res.status(200).json("user Successfully deleted");
    }
    catch(error)
    {
        console.error(error);
        const err = new Error("Error when trying to delete user");
        next(err);
    }
}
// @desc   
// @route  PATCH /api/users/:email/permanentDelete
export const hardDeleteUser = async (req, res, next) => {
    try {
        const { email } = req.params;

        // Find the user first
        const user = await userModel.findOne({ email, isDeleted: true });
        if (!user) {
            return res.status(404).json({ message: "Deleted user not found" });
        }

        // Call deleteOne on the document instance to trigger pre('deleteOne') middleware
        await user.deleteOne();

        res.status(200).json({ message: "User permanently deleted successfully", email });
    } 
    catch (error) {
        console.error(error);
        next(new Error("Error when trying to permanently delete user"));
    }
}
