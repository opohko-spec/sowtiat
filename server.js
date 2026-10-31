
const express = require("express");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");

const app = express();

const SUPABASE_URL = "https://toosuyejhjevaxmqzwkv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dmfTP6ASq8dweQQ37t-5uQ_11wJWOeF";

app.use(cors({
  origin: "https://opohko-spec.github.io"
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ABOUDSWO Server is running");
});

app.get("/getToken", async (req, res) => {
  try {
    const roomName = String(req.query.room || "");
    const authHeader = req.headers.authorization || "";
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(roomName)) {
      return res.status(400).json({ error: "Invalid room name" });
    }

    if (!accessToken) {
      return res.status(401).json({ error: "Sign in is required" });
    }

    const authResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!authResponse.ok) {
      return res.status(401).json({
        error: "Your session is invalid or expired"
      });
    }

    const user = await authResponse.json();

    if (!user?.id) {
      return res.status(401).json({
        error: "Unable to verify account"
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "LiveKit server configuration missing"
      });
    }

    const displayName =
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "ABOUDSWO Member";

    const token = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: displayName,
      ttl: "1h"
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    res.json({
      token: await token.toJwt()
    });

  } catch (error) {
    console.error("LiveKit token error:", error);
    res.status(500).json({
      error: "Could not create token"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ABOUDSWO server running on port ${PORT}`);
});
