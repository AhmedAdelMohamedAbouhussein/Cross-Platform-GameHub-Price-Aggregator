import userModel from '../../models/User.js'

export const addFriends = async (req, res, next) =>  
{
  const { userId } = req.body; // current user
  const friendId = req.params.friendId;

  try 
  {
    // Check that both users exist
    const [user, friend] = await Promise.all([
      userModel.findById(userId),
      userModel.findById(friendId)
    ]);

    if (!user || !friend) 
    {
      const error = new Error("One or both users not found");
      error.status = 404;
      return next(error)
    }

    // Prevent adding yourself
    if (userId === friendId) 
    {
      const error = new Error("You cannot add yourself as a friend");
      error.status = 400;
      return next(error);
    }

    // Add to current user's map (User platform)
    await userModel.updateOne(
      { _id: userId, "friends.User.user": { $ne: friendId } },
      { $push: { "friends.User": { user: friendId, requestedByMe: true, status: "pending"} } }
    );

    // Add to friend's map
    await userModel.updateOne(
      { _id: friendId, "friends.User.user": { $ne: userId } },
      { $push: { "friends.User": { user: userId, requestedByMe: false, status: "pending"} } }
    );

    res.status(200).json({ message: "Friend request sent!" });
  } 
  catch (err) 
  {
    next(err);
  }
};
