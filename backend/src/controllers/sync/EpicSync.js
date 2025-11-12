import axios from "axios";
import config from "../../config.js";
import userModel from "../../models/User.js"; //TODO

const CLIENT_ID = config.epic.clientId;
const CLIENT_SECRET = config.epic.clientSecret;
const REDIRECT_URI = config.epic.redirectUrl;
const FRONTEND_URL = config.frontendUrl;

// Step 1️⃣ - Redirect user to Epic login
export function syncWithEpic(req, res) {
    const authUrl = `https://www.epicgames.com/id/authorize?` + 
        new URLSearchParams({
            client_id: CLIENT_ID,
            response_type: "code",
            redirect_uri: REDIRECT_URI,
            scope: "basic_profile friends_list games_library",
        });

    res.redirect(authUrl);
}

// Step 2️⃣ - Handle Epic OAuth callback
export async function epicReturn(req, res) 
{
  const userId = req.session.userId;
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "Missing authorization code" });

  try {
    // Exchange code for tokens
    const tokenRes = await axios.post(
      "https://api.epicgames.dev/epic/oauth/v2/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        auth: {
          username: CLIENT_ID,
          password: CLIENT_SECRET,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    console.log("Epic Token Response:", tokenRes.data);

    const accessToken = tokenRes.data.access_token;
    const refreshToken = tokenRes.data.refresh_token;
    const refreshTokenExpiry = tokenRes.data.refresh_expires_at;

    // Fetch user profile
    const profileRes = await axios.get("https://api.epicgames.dev/epic/id/v2/account", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("Epic Profile Response:", profileRes.data);

    const epicId = profileRes.data.id;
    const displayName = profileRes.data.displayName;

    // Fetch owned games
    const gamesRes = await axios.get(
      `https://api.epicgames.dev/epic/ecom/v2/platform/EPIC/accounts/${epicId}/entitlements`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log("Epic Games Response:", gamesRes.data);

    const ownedGames = gamesRes.data?.elements?.map((game) => ({
      gameId: game.catalogItemId,
      gameName: game.entitlementName,
      platform: "Epic",
      coverImage: null,
      achievements: [], // Epic doesn't expose them globally yet
      progress: 0,
      hoursPlayed: null,
      lastPlayed: null,
    })) || [];

    for (const game of ownedGames) {
  try {
    const achievementRes = await axios.get(
      `https://api.epicgames.dev/epic/achievements/v1/account/${epicId}/title/${game.gameId}/progress`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log(`Epic Achievements for ${game.gameName}:`, achievementRes.data);

    game.achievements = achievementRes.data?.items?.map(a => ({
      id: a.id,
      name: a.displayName,
      description: a.description,
      unlocked: a.unlocked,
      unlockedAt: a.unlockedTime,
    })) || [];
  } catch (err) {
    // If achievements not available for a game, leave empty
    game.achievements = [];
  }
}


    // Fetch friends
    const friendsRes = await axios.get(
      `https://api.epicgames.dev/epic/social/v2/friends/${epicId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log("Epic Friends Response:", friendsRes.data);

    const friends = friendsRes.data?.map((f) => ({
      externalId: f.accountId,
      displayName: f.displayName,
      profileUrl: `https://store.epicgames.com/u/${f.accountId}`,
      avatar: null,
      status: "accepted",
      source: "Epic",
    })) || [];

    /*
    // Save to DB
    const updateData = {};
    for (const game of ownedGames) {
      updateData[`ownedGames.Epic.${game.gameId}`] = game;
    }

    await userModel.updateOne(
      { _id: userId },
      {
        $set: {
          epicId,
          epicDisplayName: displayName,
          epicAccessToken: accessToken,
          epicRefreshToken: refreshToken,
          ...updateData,
          "friends.Epic": friends,
        },
      }
    );
    */

    res.redirect(`${FRONTEND_URL}/library`);
  } catch (error) {
    console.error("Epic Auth Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Epic authentication failed",
      details: error.response?.data || error.message,
    });
  }
}
