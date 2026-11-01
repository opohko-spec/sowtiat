
const express = require("express");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");

const app = express();

app.use(cors({
  origin: "https://opohko-spec.github.io",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "20kb" }));

const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

function checkServerConfig() {
  const required = {
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET
  };

  return Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.msg || "Supabase request failed");
  }

  return data;
}

// فحص حالة الخادم
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "ABOUDSWO Server"
  });
});

// تسجيل الدخول باسم المستخدم أو البريد الإلكتروني
app.post("/login-username", async (req, res) => {
  try {
    const missing = checkServerConfig();

    if (missing.length) {
      return res.status(500).json({
        error: "Server configuration is incomplete"
      });
    }

    const username = String(req.body.username || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    if (!/^[a-z0-9_.-]{3,30}$/.test(username)) {
      return res.status(400).json({
        error: "اسم المستخدم غير صالح."
      });
    }

    if (!password || password.length > 128) {
      return res.status(400).json({
        error: "بيانات تسجيل الدخول غير صحيحة."
      });
    }

    // البحث عن البريد المرتبط باسم المستخدم
    const rows = await supabaseRequest(
      `/rest/v1/aboudswo_usernames?username=eq.${encodeURIComponent(username)}&select=user_id&limit=1`
    );

    if (!rows.length) {
      return res.status(401).json({
        error: "اسم المستخدم أو كلمة المرور غير صحيحة."
      });
    }

    const userId = rows[0].user_id;

    // جلب بيانات الحساب من Supabase Auth
    const userData = await supabaseRequest(
      `/auth/v1/admin/users/${encodeURIComponent(userId)}`
    );

    const userEmail = userData.user?.email;

    if (!userEmail) {
      return res.status(401).json({
        error: "تعذر العثور على الحساب."
      });
    }

    // تسجيل الدخول باستخدام البريد وكلمة المرور
    const loginResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: userEmail,
          password
        })
      }
    );

    const loginData = await loginResponse.json().catch(() => ({}));

    if (!loginResponse.ok) {
      return res.status(401).json({
        error: "اسم المستخدم أو كلمة المرور غير صحيحة."
      });
    }

    return res.json({
      success: true,
      session: {
        access_token: loginData.access_token,
        refresh_token: loginData.refresh_token
      }
    });

  } catch (error) {
    console.error("Username login error:", error.message);

    return res.status(500).json({
      error: "حدث خطأ في الخادم. حاول مرة أخرى."
    });
  }
});

// إصدار رمز دخول LiveKit
app.get("/getToken", async (req, res) => {
  try {
    const missing = checkServerConfig();

    if (missing.length) {
      return res.status(500).json({
        error: "Server configuration is incomplete"
      });
    }

    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const accessToken = authorization.slice(7);

    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      return res.status(401).json({
        error: "Invalid session"
      });
    }

    const user = await userResponse.json();

    if (!user.id) {
      return res.status(401).json({
        error: "Invalid user"
      });
    }

    const room = String(req.query.room || "").trim();
    const identity = user.id;

    if (!room || room.length > 100) {
      return res.status(400).json({
        error: "Invalid room name"
      });
    }

    const token = new AccessToken(
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
      {
        identity,
        ttl: "1h"
      }
    );

    token.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true
    });

    const jwt = await token.toJwt();

    return res.json({
      token: jwt,
      serverUrl: process.env.LIVEKIT_URL ||
        "wss://aboudswo-f8vzeflz.livekit.cloud"
    });

  } catch (error) {
    console.error("LiveKit token error:", error.message);

    return res.status(500).json({
      error: "Unable to create LiveKit token"
    });
  }
});

app.listen(PORT, () => {
  console.log(`ABOUDSWO server running on port ${PORT}`);
});
