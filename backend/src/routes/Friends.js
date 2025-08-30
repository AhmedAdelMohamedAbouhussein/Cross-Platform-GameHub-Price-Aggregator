app.post("/friends/add/:friendId", async (req, res) => {
  const { userId } = req.body; // current user
  const friendId = req.params.friendId;

  try {
    // Add to current user's map (User platform)
    await User.updateOne(
      { _id: userId, "friends.User.user": { $ne: friendId } },
      { $push: { "friends.User": { user: friendId, status: "pending", requestedByMe: true } } }
    );

    // Add to friend's map
    await User.updateOne(
      { _id: friendId, "friends.User.user": { $ne: userId } },
      { $push: { "friends.User": { user: userId, status: "pending", requestedByMe: false } } }
    );

    res.status(200).json({ message: "Friend request sent!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/friends/accept/:friendId", async (req, res) => {
  const { userId } = req.body; // current user
  const friendId = req.params.friendId;

  try {
    // Update current user
    await User.updateOne(
      { _id: userId, "friends.User.user": friendId },
      { $set: { "friends.User.$.status": "accepted" } }
    );

    // Update friend
    await User.updateOne(
      { _id: friendId, "friends.User.user": userId },
      { $set: { "friends.User.$.status": "accepted" } }
    );

    res.status(200).json({ message: "Friend request accepted!" });
  } 
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/friends/remove/:friendId", async (req, res) => {
  const { userId } = req.body;
  const friendId = req.params.friendId;

  try {
    await User.updateOne({ _id: userId }, { $pull: { "friends.User": { user: friendId } } });
    await User.updateOne({ _id: friendId }, { $pull: { "friends.User": { user: userId } } });

    res.status(200).json({ message: "Friend removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
