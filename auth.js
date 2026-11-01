import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://toosuyejhjevaxmqzwkv.supabase.co";
const SUPABASE_KEY = "sb_publishable_0ZBINmMPhDTNZjJ_nYC7Gg_hWUZTYHL";
const SERVER_URL = "https://aboudswo-server.onrender.com";
const INTERNAL_DOMAIN = "accounts.aboudswo.local";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

window.aboudswoSupabase = supabase;

const style = document.createElement("style");
style.textContent = `
#ab-auth{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;
justify-content:center;padding:18px;background:radial-gradient(ellipse at top,#38270d,#090909 65%);
direction:rtl;font-family:Cairo,Arial,sans-serif}
#ab-auth .panel{width:100%;max-width:390px;padding:27px;background:#171717;
border:1px solid #80632b;border-radius:22px;color:#f8f4e9;text-align:center;
box-shadow:0 20px 70px #000}
#ab-auth .crown{font-size:36px;color:#f2d994}
#ab-auth h2{margin:5px 0;color:#f2d994}
#ab-auth p{color:#aaa18f;margin:0 0 20px}
#ab-auth input{width:100%;box-sizing:border-box;padding:13px;margin:7px 0;
border:1px solid #40331d;border-radius:11px;background:#0d0d0d;color:white;
font:inherit;outline:none}
#ab-auth input:focus{border-color:#d7b15a}
#ab-auth button{width:100%;padding:13px;margin-top:10px;border:0;border-radius:11px;
background:linear-gradient(135deg,#f2d994,#bd8d38);color:#17120a;
font:inherit;font-weight:800;cursor:pointer}
#ab-auth button.secondary{background:#24211b;border:1px solid #40331d;color:#f2d994}
#ab-auth .switch{margin-top:17px;color:#d7b15a;cursor:pointer;font-size:13px}
#ab-auth .message{min-height:22px;margin-top:12px;color:#f2d994;font-size:13px}
#ab-logout{background:#24211b;color:#f2d994;border:1px solid #80632b;
padding:8px 12px;border-radius:9px;cursor:pointer;margin:8px}
`;
document.head.appendChild(style);

function usernameEmail(username) {
  return `${username.toLowerCase()}@${INTERNAL_DOMAIN}`;
}

function showAuth(mode = "login") {
  document.getElementById("ab-auth")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "ab-auth";

  function render() {
    const registering = mode === "register";

    overlay.innerHTML = `
      <div class="panel">
        <div class="crown">♛</div>
        <h2>عبود الملك</h2>
        <p>${registering ? "أنشئ حسابك وابدأ رحلتك" : "مرحباً بعودتك إلى ABOUDSWO"}</p>

        <input id="ab-username" placeholder="اسم المستخدم"
          autocomplete="username" maxlength="20">

        <input id="ab-password" type="password"
          placeholder="كلمة المرور" autocomplete="current-password">

        ${registering ? `
          <input id="ab-confirm" type="password"
            placeholder="تأكيد كلمة المرور" autocomplete="new-password">
        ` : ""}

        <button id="ab-submit">${registering ? "إنشاء الحساب" : "دخول"}</button>

        <div class="switch" id="ab-switch">
          ${registering ? "لديك حساب؟ سجّل الدخول" : "ليس لديك حساب؟ إنشاء حساب جديد"}
        </div>
        <div class="message" id="ab-message"></div>
      </div>
    `;

    overlay.querySelector("#ab-switch").onclick = () => {
      mode = registering ? "login" : "register";
      render();
    };

    overlay.querySelector("#ab-submit").onclick = async () => {
      const username = overlay.querySelector("#ab-username").value.trim().toLowerCase();
      const password = overlay.querySelector("#ab-password").value;
      const message = overlay.querySelector("#ab-message");
      const say = text => message.textContent = text;

      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        return say("اسم المستخدم من 3 إلى 20 حرفاً إنجليزياً أو رقماً أو _");
      }

      if (password.length < 8) {
        return say("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      }

      say(registering ? "جارٍ إنشاء الحساب..." : "جارٍ تسجيل الدخول...");

      try {
        if (registering) {
          const confirm = overlay.querySelector("#ab-confirm").value;
          if (password !== confirm) {
            return say("كلمتا المرور غير متطابقتين");
          }

          const { data, error } = await supabase.auth.signUp({
            email: usernameEmail(username),
            password,
            options: {
              data: {
                username,
                display_name: username
              }
            }
          });

          if (error) throw error;
          if (!data.user) throw new Error("لم يتم إنشاء الحساب");

          const { error: usernameError } = await supabase
            .from("aboudswo_usernames")
            .insert({ user_id: data.user.id, username });

          if (usernameError) {
            throw new Error(
              usernameError.code === "23505"
                ? "اسم المستخدم مستخدم مسبقاً"
                : "تعذر حفظ اسم المستخدم: " + usernameError.message
            );
          }

          if (!data.session) {
            return say("الحساب أُنشئ، لكن Supabase ما زال يطلب تأكيداً. تأكد أن تأكيد البريد معطّل في إعدادات المشروع.");
          }

          overlay.remove();
          await onAuthenticated(data.user);
        } else {
          const response = await fetch(SERVER_URL + "/login-username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
          });

          const result = await response.json();
          if (!response.ok || !result.session) {
            throw new Error(result.error || "اسم المستخدم أو كلمة المرور غير صحيحة");
          }

          const { data, error } = await supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token
          });

          if (error) throw error;

          overlay.remove();
          await onAuthenticated(data.session?.user);
        }
      } catch (error) {
        say(error.message || "حدث خطأ، حاول مرة أخرى");
      }
    };
  }

  document.body.appendChild(overlay);
  render();
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

  window.dispatchEvent(new CustomEvent("aboudswo-user-authenticated", {
    detail: { user }
  }));

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
    if (error) return alert("تعذر تسجيل الخروج: " + error.message);
    location.reload();
  };

  const profile = document.getElementById("profileName");
  if (profile?.parentElement) profile.parentElement.appendChild(button);
  else document.body.appendChild(button);
}

async function initializeAuth() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error("Auth session error:", error);

  if (data.session?.user) {
    await onAuthenticated(data.session.user);
  } else {
    showAuth();
  }

  window.dispatchEvent(new Event("aboudswo-ready"));
}

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "SIGNED_IN" && session?.user) {
    document.getElementById("ab-auth")?.remove();
    await onAuthenticated(session.user);
  }

  if (event === "SIGNED_OUT") showAuth();
});

initializeAuth();
