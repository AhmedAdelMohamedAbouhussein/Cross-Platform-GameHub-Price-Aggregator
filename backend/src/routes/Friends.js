app.post("/friends/add/:friendId", async (req, res) => {
  const { userId } = req.body; // current user
  const friendId = req.params.friendId;

  try {
    // Check that both users exist
    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId)
    ]);

    if (!user || !friend) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    // Prevent adding yourself
    if (userId === friendId) {
      return res.status(400).json({ error: "You cannot add yourself as a friend" });
    }

    // Add to current user's map (User platform)
    await User.updateOne(
      { _id: userId, "friends.User.user": { $ne: friendId } },
      { $push: { "friends.User": { user: friendId, requestedByMe: true, status: "pending" } } }
    );

    // Add to friend's map
    await User.updateOne(
      { _id: friendId, "friends.User.user": { $ne: userId } },
      { $push: { "friends.User": { user: userId, requestedByMe: false, status: "pending" } } }
    );

    res.status(200).json({ message: "Friend request sent!" });
  } 
  catch (err) 
  {
    res.status(500).json({ error: err.message });
  }
});



app.post("/friends/accept/:friendId", async (req, res) => {
  const { userId } = req.body; // current user
  const friendId = req.params.friendId;

  try {
    // Make sure both exist
    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId),
    ]);

    if (!user || !friend) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    // Update current user (only if status is still pending)
    const userUpdate = await User.updateOne(
      { _id: userId, "friends.User.user": friendId, "friends.User.status": "pending" },
      { $set: { "friends.User.$.status": "accepted" } }
    );

    // Update friend (only if status is still pending)
    const friendUpdate = await User.updateOne(
      { _id: friendId, "friends.User.user": userId, "friends.User.status": "pending" },
      { $set: { "friends.User.$.status": "accepted" } }
    );

    if (!userUpdate.modifiedCount || !friendUpdate.modifiedCount) {
      return res.status(400).json({ error: "No pending request found to accept" });
    }

    res.status(200).json({ message: "Friend request accepted!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.post("/friends/reject/:friendId", async (req, res) => {
  const { userId } = req.body; // current user
  const friendId = req.params.friendId;

  try {
    // Ensure both users exist
    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId),
    ]);

    if (!user || !friend) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    // Remove pending request from current user
    const userUpdate = await User.updateOne(
      { _id: userId },
      { $pull: { "friends.User": { user: friendId, status: "pending" } } }
    );

    // Remove pending request from friend
    const friendUpdate = await User.updateOne(
      { _id: friendId },
      { $pull: { "friends.User": { user: userId, status: "pending" } } }
    );

    if (!userUpdate.modifiedCount && !friendUpdate.modifiedCount) {
      return res.status(400).json({ error: "No pending request found" });
    }

    res.status(200).json({ message: "Friend request rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.post("/friends/remove/:friendId", async (req, res) => {
  const { userId } = req.body;
  const friendId = req.params.friendId;

  try {
    // Ensure both users exist
    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId),
    ]);

    if (!user || !friend) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    // Remove friend from current user
    const userUpdate = await User.updateOne(
      { _id: userId },
      { $pull: { "friends.User": { user: friendId } } }
    );

    // Remove current user from friend
    const friendUpdate = await User.updateOne(
      { _id: friendId },
      { $pull: { "friends.User": { user: userId } } }
    );

    if (!userUpdate.modifiedCount && !friendUpdate.modifiedCount) {
      return res.status(400).json({ error: "Friendship not found" });
    }

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

