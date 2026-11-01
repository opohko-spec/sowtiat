import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
  "https://toosuyejhjevaxmqzwkv.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_0ZBINmMPhDTNZjJ_nYC7Gg_hWUZTYHL";

const SERVER_URL =
  "https://aboudswo-server.onrender.com";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

window.aboudswoSupabase = supabase;

const style = document.createElement("style");
style.textContent = `
#ab-auth {
  position:fixed; inset:0; z-index:99999;
  background:rgba(0,0,0,.94);
  display:flex; align-items:center;
  justify-content:center; padding:18px;
  direction:rtl; font-family:Arial,sans-serif;
}
#ab-auth .panel {
  width:100%; max-width:390px;
  background:#171717; border:1px solid #c9a43b;
  border-radius:18px; padding:25px;
  color:white; text-align:center;
}
#ab-auth h2 {color:#e5bd52;margin:5px 0 20px}
#ab-auth input {
  width:100%; box-sizing:border-box;
  padding:14px; margin:7px 0;
  border:1px solid #555; border-radius:9px;
  background:#242424;color:white;font-size:15px;
}
#ab-auth button {
  width:100%; padding:13px; margin-top:10px;
  border:0;border-radius:9px;
  background:#d5ad43;color:#111;
  font-weight:bold;font-size:15px;cursor:pointer;
}
#ab-auth .secondary {
  background:#333;color:white;
}
#ab-auth .message {
  color:#f0cc68; font-size:13px;
  min-height:22px; margin-top:12px;
}
#ab-logout {
  background:#333;color:white;border:1px solid #c9a43b;
  padding:8px 12px;border-radius:8px;
  cursor:pointer;margin:8px;
}
`;
document.head.appendChild(style);

function showAuth() {
  if (document.getElementById("ab-auth")) return;

  const overlay = document.createElement("div");
  overlay.id = "ab-auth";

  overlay.innerHTML = `
    <div class="panel">
      <h2>👑 عبود الملك</h2>
      <p>مرحباً بك في ABOUDSWO</p>

      <input id="ab-identity"
        placeholder="البريد الإلكتروني أو اسم المستخدم"
        autocomplete="username">

      <input id="ab-password" type="password"
        placeholder="كلمة المرور"
        autocomplete="current-password">

      <button id="ab-login">تسجيل الدخول</button>

      <hr style="border-color:#444;margin:20px 0">

      <input id="ab-email" type="email"
        placeholder="البريد الإلكتروني">

      <input id="ab-username"
        placeholder="اسم المستخدم">

      <input id="ab-new-password" type="password"
        placeholder="كلمة المرور">

      <button id="ab-register">إنشاء حساب جديد</button>

      <button id="ab-reset" class="secondary">
        نسيت كلمة المرور؟
      </button>

      <div class="message" id="ab-message"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  const message = text =>
    document.getElementById("ab-message").textContent = text;

  document.getElementById("ab-login").onclick =
    async () => {
      const identity =
        document.getElementById("ab-identity").value.trim();
      const password =
        document.getElementById("ab-password").value;

      if (!identity || !password) {
        return message("أدخل اسم المستخدم أو البريد وكلمة المرور");
      }

      message("جارٍ تسجيل الدخول...");

      try {
        let result;

        if (identity.includes("@")) {
          result = await supabase.auth.signInWithPassword({
            email: identity,
            password
          });
        } else {
          const response = await fetch(
            SERVER_URL + "/login-username",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username: identity.toLowerCase(),
                password
              })
            }
          );

          const data = await response.json();

          if (!response.ok || !data.session) {
            throw new Error(data.error || "تعذر تسجيل الدخول");
          }

          result = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
        }

        if (result.error) throw result.error;

        message("تم تسجيل الدخول بنجاح");
        overlay.remove();
        await onAuthenticated(result.data.session?.user);

      } catch (error) {
        message(error.message || "حدث خطأ أثناء الدخول");
      }
    };

  document.getElementById("ab-register").onclick =
    async () => {
      const email =
        document.getElementById("ab-email").value.trim();
      const username =
        document.getElementById("ab-username")
          .value.trim().toLowerCase();
      const password =
        document.getElementById("ab-new-password").value;

      if (!email || !username || !password) {
        return message("يرجى تعبئة جميع الحقول");
      }

      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        return message(
          "اسم المستخدم: أحرف إنجليزية وأرقام وشرطة سفلية، من 3 إلى 20"
        );
      }

      if (password.length < 8) {
        return message("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      }

      message("جارٍ إنشاء الحساب...");

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              display_name: username
            }
          }
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error("لم يتم إنشاء الحساب");
        }

        const { error: usernameError } = await supabase
          .from("aboudswo_usernames")
          .insert({
            user_id: data.user.id,
            username
          });

        if (usernameError) {
          throw new Error(
            usernameError.code === "23505"
              ? "اسم المستخدم مستخدم مسبقاً"
              : "تم إنشاء الحساب، لكن تعذر حفظ اسم المستخدم: " +
                usernameError.message
          );
        }

        if (data.session) {
          overlay.remove();
          await onAuthenticated(data.user);
        } else {
          message(
            "تم إنشاء الحساب. تحقق من إعدادات تأكيد البريد إذا طُلب منك ذلك."
          );
        }

      } catch (error) {
        message(error.message || "تعذر إنشاء الحساب");
      }
    };

  document.getElementById("ab-reset").onclick =
    async () => {
      const email =
        document.getElementById("ab-email").value.trim();

      if (!email) {
        return message("اكتب بريدك الإلكتروني أولاً");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            "https://opohko-spec.github.io/sowtiat/"
        }
      );

      message(
        error ? error.message : "إذا كان البريد مسجلاً، ستصلك تعليمات الاستعادة."
      );
    };
}

async function onAuthenticated(user) {
  if (!user) return;

  const name =
    user.user_metadata?.display_name ||
    user.user_metadata?.username ||
    user.email?.split("@")[0] ||
    "عضو";

  const profileName = document.getElementById("profileName");
  if (profileName) profileName.textContent = name;

  addLogoutButton();

  window.dispatchEvent(
    new CustomEvent("aboudswo-user-authenticated", {
      detail: { user }
    })
  );

  if (typeof window.loadRooms === "function") {
    window.loadRooms();
  }
}

function addLogoutButton() {
  if (document.getElementById("ab-logout")) return;

  const button = document.createElement("button");
  button.id = "ab-logout";
  button.textContent = "تسجيل الخروج";

  button.onclick = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("تعذر تسجيل الخروج: " + error.message);
      return;
    }

    location.reload();
  };

  const profile = document.getElementById("profileName");
  if (profile?.parentElement) {
    profile.parentElement.appendChild(button);
  } else {
    document.body.appendChild(button);
  }
}

async function initializeAuth() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Auth session error:", error);
  }

  if (data.session?.user) {
    await onAuthenticated(data.session.user);
  } else {
    showAuth();
  }

  window.dispatchEvent(new Event("aboudswo-ready"));
}

supabase.auth.onAuthStateChange(
  async (event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      document.getElementById("ab-auth")?.remove();
      await onAuthenticated(session.user);
    }

    if (event === "SIGNED_OUT") {
      showAuth();
    }
  }
);

initializeAuth();
