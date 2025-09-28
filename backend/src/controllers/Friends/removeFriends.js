import userModel from '../../models/User.js'

export const removeFriends = async (req, res) =>
{
  const { userId } = req.body;
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

    // Remove friend from current user
    const userUpdate = await userModel.updateOne(
      { _id: userId },
      { $pull: { "friends.User": { user: friendId } } }
    );

    // Remove current user from friend
    const friendUpdate = await userModel.updateOne(
      { _id: friendId },
      { $pull: { "friends.User": { user: userId } } }
    );

    if (!userUpdate.modifiedCount && !friendUpdate.modifiedCount) 
    {
      const error = new Error("Friendship not found" );
      error.status = 400;
      return next(error);
    }

    res.status(200).json({ message: "Friend removed successfully" });
  }
  catch (err) 
  {
    next(err);
  }
}