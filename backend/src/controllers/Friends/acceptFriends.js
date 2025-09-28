import userModel from '../../models/User.js'

export const acceptFriends = async (req, res, next) => {
  const { publicID } = req.body; // current user
  const friendPublicID = decodeURIComponent(req.params.friendId); // param now refers to friend's publicID

  try {
    // Make sure both exist
    const [user, friend] = await Promise.all([
      userModel.findOne({ publicID }),
      userModel.findOne({ publicID: friendPublicID }),
    ]);

    if (!user || !friend) {
      const error = new Error("One or both users not found");
      error.status = 404;
      return next(error);
    }

    // Update current user (only if status is still pending)
    const userUpdate = await userModel.updateOne(
      { publicID, "friends.User.user": friendPublicID, "friends.User.status": "pending" },
      { $set: { "friends.User.$.status": "accepted" } }
    );

    // Update friend (only if status is still pending)
    const friendUpdate = await userModel.updateOne(
      { publicID: friendPublicID, "friends.User.user": publicID, "friends.User.status": "pending" },
      { $set: { "friends.User.$.status": "accepted" } }
    );

    if (!userUpdate.modifiedCount || !friendUpdate.modifiedCount) {
      const error = new Error("No pending request found to accept");
      error.status = 400;
      return next(error);
    }

    res.status(200).json({ message: "Friend request accepted!" });
  } catch (err) {
    next(err);
  }
};
