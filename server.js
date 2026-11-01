const express = require("express");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");

const app = express();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

app.use(cors({
  origin: "https://opohko-spec.github.io"
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("ABOUDSWO Server is running");
});

app.get("/getToken", async (req, res) => {

  console.log("ABOUDSWO: طلب دخول غرفة", {
    room: req.query.room,
    hasAuthorization: Boolean(req.headers.authorization)
  });

  try {
    const roomName = String(req.query.room || "");

    const authHeader = req.headers.authorization || "";

    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(roomName)) {
      console.log("ABOUDSWO: اسم الغرفة غير صالح");

      return res.status(400).json({
        error: "Invalid room name"
      });
    }

    if (!accessToken) {
      console.log("ABOUDSWO: لا يوجد رمز جلسة");

      return res.status(401).json({
        error: "Sign in is required"
      });
    }

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      console.error("ABOUDSWO: إعدادات Supabase ناقصة", {
        hasSupabaseUrl: Boolean(SUPABASE_URL),
        hasPublishableKey: Boolean(SUPABASE_PUBLISHABLE_KEY)
      });

      return res.status(500).json({
        error: "Supabase server configuration missing"
      });
    }

    const authResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/user`,
      {
        method: "GET",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!authResponse.ok) {
      console.error("ABOUDSWO: فشل التحقق من Supabase", {
        status: authResponse.status
      });

      return res.status(401).json({
        error: "Your session is invalid or expired"
      });
    }

    const user = await authResponse.json();

    if (!user || !user.id) {
      console.error("ABOUDSWO: تعذر معرفة المستخدم");

      return res.status(401).json({
        error: "Unable to verify account"
      });
    }

    console.log("ABOUDSWO: تم التحقق من حساب المستخدم");

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error("ABOUDSWO: إعدادات LiveKit ناقصة", {
        hasApiKey: Boolean(apiKey),
        hasApiSecret: Boolean(apiSecret)
      });

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

    const jwt = await token.toJwt();

    console.log("ABOUDSWO: تم إنشاء رمز دخول LiveKit", {
      room: roomName,
      userId: user.id
    });

    return res.json({
      token: jwt
    });

  } catch (error) {

    console.error("ABOUDSWO: خطأ أثناء إنشاء رمز LiveKit", {
      name: error?.name,
      message: error?.message
    });

    return res.status(500).json({
      error: "Could not create token"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ABOUDSWO server running on port ${PORT}`);
});
