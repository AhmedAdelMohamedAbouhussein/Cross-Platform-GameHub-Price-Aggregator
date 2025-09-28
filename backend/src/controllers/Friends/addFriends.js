import userModel from '../../models/User.js'

export const addFriends = async (req, res, next) => {
  const { publicID } = req.body; // current user
  const friendPublicID = decodeURIComponent(req.params.friendId); // param now refers to friend's publicID

  console.log("Add friend request from", publicID, "to", friendPublicID);
  
  try {
    // Check that both users exist
    const [user, friend] = await Promise.all([
      userModel.findOne({ publicID }),
      userModel.findOne({ publicID: friendPublicID }),
    ]);

    if (!user || !friend) {
      const error = new Error("One or both users not found");
      error.status = 404;
      return next(error);
    }

    // Prevent adding yourself
    if (publicID === friendPublicID) {
      const error = new Error("You cannot add yourself as a friend");
      error.status = 400;
      return next(error);
    }

    // Add to current user's friends (only if not already added)
    await userModel.updateOne(
      { publicID, "friends.User.user": { $ne: friendPublicID } },
      { $push: { "friends.User": { user: friendPublicID, requestedByMe: true, status: "pending" } } }
    );

    // Add to friend's friends (only if not already added)
    await userModel.updateOne(
      { publicID: friendPublicID, "friends.User.user": { $ne: publicID } },
      { $push: { "friends.User": { user: publicID, requestedByMe: false, status: "pending" } } }
    );

    res.status(200).json({ message: "Friend request sent!" });
  } catch (err) {
    next(err);
  }
};
