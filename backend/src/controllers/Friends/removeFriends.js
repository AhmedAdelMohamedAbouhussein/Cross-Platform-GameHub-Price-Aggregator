import userModel from '../../models/User.js'

export const removeFriends = async (req, res, next) => {
  const friendPublicID = decodeURIComponent(req.params.friendId); // param now refers to friend's publicID

  try {
    // Ensure both users exist
    const [user, friend] = await Promise.all([
      userModel.findById(req.session.userId),
      userModel.findOne({ publicID: friendPublicID }),
    ]);

    if (!user || !friend) {
      const error = new Error("One or both users not found");
      error.status = 404;
      return next(error);
    }

    const publicID = user.publicID;

    // Remove friend from current user
    const userUpdate = await userModel.updateOne(
      { publicID },
      { $pull: { "friends.User": { user: friendPublicID } } }
    );

    // Remove current user from friend
    const friendUpdate = await userModel.updateOne(
      { publicID: friendPublicID },
      { $pull: { "friends.User": { user: publicID } } }
    );

    if (!userUpdate.modifiedCount && !friendUpdate.modifiedCount) {
      const error = new Error("Friendship not found");
      error.status = 400;
      return next(error);
    }

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (err) {
    next(err);
  }
};
