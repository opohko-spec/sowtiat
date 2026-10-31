const express = require("express");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ABOUDSWO Server is running");
});

app.get("/getToken", async (req, res) => {
  try {
    const roomName = req.query.room;
    const participantName = req.query.name;
    if (!roomName || !participantName) {
      return res.status(400).json({ error: "Room and name are required" });
    }
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: "Server configuration missing" });
    }
    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      ttl: "1h"
    });
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true
    });
    res.json({ token: await token.toJwt() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create token" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`ABOUDSWO server running on port ${PORT}`);
});
