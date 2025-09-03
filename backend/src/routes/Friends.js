//const userWithFriends = await User.findById(userId)
//.populate("friends.user", "name profilePicture role steamId xboxId");

import userModel from '../models/User.js'
import express from 'express';

const router = express.Router();

router.post("/add/:friendId", async (req, res, next) => {
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
      { $push: { "friends.User": { user: friendId, requestedByMe: true, status: "pending", displayName: friend.name} } }
    );

    // Add to friend's map
    await userModel.updateOne(
      { _id: friendId, "friends.User.user": { $ne: userId } },
      { $push: { "friends.User": { user: userId, requestedByMe: false, status: "pending", displayName: user.name} } }
    );

    res.status(200).json({ message: "Friend request sent!" });
  } 
  catch (err) 
  {
    next(err);
  }
});



router.post("/accept/:friendId", async (req, res) => {
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
});



router.post("/reject/:friendId", async (req, res) => {
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
});



router.post("/remove/:friendId", async (req, res) => {
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
});


export default router;