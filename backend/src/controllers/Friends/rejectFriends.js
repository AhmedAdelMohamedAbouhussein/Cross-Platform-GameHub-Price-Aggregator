import userModel from '../../models/User.js'

export const rejectFriends = async (req, res) => 
{
  const { userId } = req.body; // current user
  const friendId = req.params.friendId;

  try {
    // Ensure both users exist
    const [user, friend] = await Promise.all([
      userModel.findById(userId),
      userModel.findById(friendId),
    ]);

    if (!user || !friend) {
      const error = new Error("One or both users not found");
      error.status = 404;
      return next(error)
    }

    // Remove pending request from current user
    const userUpdate = await userModel.updateOne(
      { _id: userId },
      { $pull: { "friends.User": { user: friendId, status: "pending" } } }
    );

    // Remove pending request from friend
    const friendUpdate = await userModel.updateOne(
      { _id: friendId },
      { $pull: { "friends.User": { user: userId, status: "pending" } } }
    );

    if (!userUpdate.modifiedCount && !friendUpdate.modifiedCount) 
    {
      const error = new Error("No pending request found");
      error.status = 400;
      return next(error);
    }

    res.status(200).json({ message: "Friend request rejected" });
  } 
  catch (err) 
  {
    next(err);
  }
}