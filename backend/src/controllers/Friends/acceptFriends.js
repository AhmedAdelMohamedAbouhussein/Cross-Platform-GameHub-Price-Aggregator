import userModel from '../../models/User.js'

export const acceptFriends = async (req, res) =>  
{
  const { userId } = req.body; // current user
  const friendId = req.params.friendId;

  try {
    // Make sure both exist
    const [user, friend] = await Promise.all([
      userModel.findById(userId),
      userModel.findById(friendId),
    ]);

    if (!user || !friend) 
    {
      const error = new Error("One or both users not found");
      error.status = 404;
      return next(error)
    }

    // Update current user (only if status is still pending)
    const userUpdate = await userModel.updateOne(
      { _id: userId, "friends.User.user": friendId, "friends.User.status": "pending" },
      { $set: { "friends.User.$.status": "accepted" } }
    );

    // Update friend (only if status is still pending)
    const friendUpdate = await userModel.updateOne(
      { _id: friendId, "friends.User.user": userId, "friends.User.status": "pending" },
      { $set: { "friends.User.$.status": "accepted" } }
    );

    if (!userUpdate.modifiedCount || !friendUpdate.modifiedCount) 
    {
      const error = new Error("No pending request found to accept");
      error.status = 400;
      return next(error);
    }

    res.status(200).json({ message: "Friend request accepted!" });
  }
  catch (err) 
  {
    next(err);
  }
}