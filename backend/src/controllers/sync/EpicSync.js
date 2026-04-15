import axios from "axios";
import config from "../../config/env.js";
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
export async function epicReturn(req, res) {
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

    // ... (fetch games and friends logic exists above) ...

    // 1. Update Linked Accounts
    const dbUser = await userModel.findById(userId);
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    let linkedAccounts = dbUser.linkedAccounts || new Map();
    let epicAccounts = linkedAccounts.get("Epic") || [];

    const existingAccIndex = epicAccounts.findIndex(acc => acc.accountId === epicId);
    const accountData = {
      accountId: epicId,
      displayName: displayName,
      refreshToken: refreshToken,
      expiresAt: new Date(Date.now() + (refreshTokenExpiry * 1000)),
      lastSync: new Date()
    };

    if (existingAccIndex > -1) {
      epicAccounts[existingAccIndex] = accountData;
    } else {
      epicAccounts.push(accountData);
    }
    linkedAccounts.set("Epic", epicAccounts);
    dbUser.linkedAccounts = linkedAccounts;

    // 2. Update Friends
    if (!dbUser.friends) dbUser.friends = new Map();
    let currentEpicFriends = dbUser.friends.get("Epic") || [];
    currentEpicFriends = currentEpicFriends.filter(f => f.linkedAccountId !== epicId);

    const newFriends = friends.map(f => ({
      ...f,
      linkedAccountId: epicId,
      status: "accepted",
      source: "Epic"
    }));
    dbUser.friends.set("Epic", [...currentEpicFriends, ...newFriends]);

    // 3. Update Owned Games
    if (!dbUser.ownedGames) dbUser.ownedGames = new Map();
    let epicGamesMap = dbUser.ownedGames.get("Epic") || new Map();

    for (const game of ownedGames) {
      if (!game || !game.gameId) continue;

      const gameId = String(game.gameId);

      let existingGame = epicGamesMap.get(gameId);
      const ownerRecord = {
        accountId: epicId,
        accountName: displayName,
        hoursPlayed: game.hoursPlayed,
        lastPlayed: game.lastPlayed,
        progress: game.progress || 0,
        achievements: game.achievements || []
      };

      if (existingGame) {
        const existingOwnerIndex = existingGame.owners.findIndex(o => o.accountId === epicId);
        if (existingOwnerIndex > -1) {
          existingGame.owners[existingOwnerIndex] = ownerRecord;
        } else {
          existingGame.owners.push(ownerRecord);
        }
        existingGame.maxProgress = Math.max(...existingGame.owners.map(o => o.progress || 0));
      } else {
        epicGamesMap.set(gameId, {
          gameName: game.gameName,
          gameId: gameId,
          platform: "Epic",
          coverImage: game.coverImage,
          owners: [ownerRecord],
          maxProgress: ownerRecord.progress,
          totalHours: ownerRecord.hoursPlayed
        });
      }
    }
    dbUser.ownedGames.set("Epic", epicGamesMap);

    await dbUser.save();

    res.redirect(`${FRONTEND_URL}/library`);
  } catch (error) {
    console.error("Epic Auth Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Epic authentication failed",
      details: error.response?.data || error.message,
    });
  }
}
