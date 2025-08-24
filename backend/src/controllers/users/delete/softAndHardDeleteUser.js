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