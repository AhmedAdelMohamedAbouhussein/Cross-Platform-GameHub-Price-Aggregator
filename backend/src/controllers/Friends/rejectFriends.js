import userModel from '../../models/User.js'

export const rejectFriends = async (req, res, next) => {
  const { publicID } = req.body; // current user
  const friendPublicID = decodeURIComponent(req.params.friendId); // param now refers to friend's publicID

  try {
    // Ensure both users exist
    const [user, friend] = await Promise.all([
      userModel.findOne({ publicID }),
      userModel.findOne({ publicID: friendPublicID }),
    ]);

    if (!user || !friend) {
      const error = new Error("One or both users not found");
      error.status = 404;
      return next(error);
    }

    // Remove pending request from current user
    const userUpdate = await userModel.updateOne(
      { publicID },
      { $pull: { "friends.User": { user: friendPublicID, status: "pending" } } }
    );

    // Remove pending request from friend
    const friendUpdate = await userModel.updateOne(
      { publicID: friendPublicID },
      { $pull: { "friends.User": { user: publicID, status: "pending" } } }
    );

    if (!userUpdate.modifiedCount && !friendUpdate.modifiedCount) {
      const error = new Error("No pending request found");
      error.status = 400;
      return next(error);
    }

    res.status(200).json({ message: "Friend request rejected" });
  } catch (err) {
    next(err);
  }
};
