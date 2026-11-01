
const express = require("express");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");

const app = express();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

app.use(cors({
  origin: "https://opohko-spec.github.io"
}));

app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.send("ABOUDSWO Server is running");
});

// تسجيل الدخول باسم المستخدم
app.post("/login-username", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username) || !password) {
      return res.status(400).json({
        error: "اسم المستخدم أو كلمة المرور غير صحيحة"
      });
    }

    if (
      !SUPABASE_URL ||
      !SUPABASE_PUBLISHABLE_KEY ||
      !SUPABASE_SERVICE_ROLE_KEY
    ) {
      return res.status(500).json({
        error: "Server configuration missing"
      });
    }

    // البحث عن حساب اسم المستخدم
    const lookupUrl = new URL(
      "/rest/v1/aboudswo_usernames",
      SUPABASE_URL
    );

    lookupUrl.search = new URLSearchParams({
      username: `eq.${username}`,
      select: "user_id",
      limit: "1"
    }).toString();

    const lookupResponse = await fetch(lookupUrl, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (!lookupResponse.ok) {
      throw new Error("Username lookup failed");
    }

    const rows = await lookupResponse.json();

    if (!rows.length) {
      return res.status(401).json({
        error: "اسم المستخدم أو كلمة المرور غير صحيحة"
      });
    }

    // جلب البريد المرتبط بمعرّف الحساب من Supabase
    const userResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(rows[0].user_id)}`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    if (!userResponse.ok) {
      throw new Error("Account lookup failed");
    }

    const user = await userResponse.json();

    if (!user.email) {
      return res.status(401).json({
        error: "اسم المستخدم أو كلمة المرور غير صحيحة"
      });
    }

    // التحقق من كلمة المرور بواسطة Supabase Auth
    const loginResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email,
          password
        })
      }
    );

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      return res.status(401).json({
        error: "اسم المستخدم أو كلمة المرور غير صحيحة"
      });
    }

    return res.json({
      session: {
        access_token: loginData.access_token,
        refresh_token: loginData.refresh_token
      }
    });

  } catch (error) {
    console.error("Username login error:", error.message);

    return res.status(500).json({
      error: "تعذر تسجيل الدخول حالياً"
    });
  }
});

// رمز دخول LiveKit
app.get("/getToken", async (req, res) => {
  try {
    const roomName = String(req.query.room || "");
    const authHeader = req.headers.authorization || "";

    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(roomName)) {
      return res.status(400).json({
        error: "Invalid room name"
      });
    }

    if (!accessToken) {
      return res.status(401).json({
        error: "Sign in is required"
      });
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

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "LiveKit configuration missing"
      });
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "ABOUDSWO Member",
      ttl: "1h"
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    return res.json({
      token: await token.toJwt()
    });

  } catch (error) {
    console.error("LiveKit token error:", error.message);

    return res.status(500).json({
      error: "Could not create token"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ABOUDSWO server running on port ${PORT}`);
});

