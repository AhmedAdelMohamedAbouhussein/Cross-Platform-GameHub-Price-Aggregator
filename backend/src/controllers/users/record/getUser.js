import userModel from '../../../models/User.js'

// @desc   
// @route  PATCH /api/users/getbyid/:id
export const getUserByID =  async (req, res, next) => //search for a user by ID
{ 
    try 
    {
        const id = req.params.id;
        if (!id) 
        {   
            const err = new Error("Email params parameter is required" );
            err.status = 400;
            next(err);
            return;
        }

        const users = await userModel.find({isDeleted: false, _id: id});        
        res.status(200).json(users);
    } 
    catch (error) 
    {
        console.error(error);
        const err = new Error("Wasn't able to get user list");
        next(err);
    }
}

// @desc   
// @route  PATCH /api/users/getbymail/:email
export const getUserByEmail = async (req, res, next) => {
    try 
    {
        const email = req.params.email;
        if (!email) 
        {   
            const err = new Error("Email params parameter is required" );
            err.status = 400;
            next(err);
            return;
        }
        const user = await userModel.findOne({email: email, isDeleted: false });

        if (user) 
        {
            res.status(200).json(user);
        } 
        else 
        {
            const err = new Error("User not found");
            err.status = 404;
            next(err);
        }
    } 
    catch (error) 
    {
        console.error(error);
        const err = new Error("Error when trying to retrieve user");
        next(err);
    }
}