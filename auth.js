
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://toosuyejhjevaxmqzwkv.supabase.co";
const SUPABASE_KEY = "sb_publishable_dmfTP6ASq8dweQQ37t-5uQ_11wJWOeF";
const SITE_URL = "https://opohko-spec.github.io/sowtiat/";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// إتاحة جلسة Supabase لنظام الغرف الصوتية
window.aboudswoSupabase = supabase;

const style = document.createElement("style");
style.textContent = `
body:not(.auth-ready) .app,
body:not(.auth-ready) .tabs,
body.auth-ready:not(.authenticated) .app,
body.auth-ready:not(.authenticated) .tabs {
  display:none !important;
}
#aboud-auth {
  display:none;
  min-height:100vh;
  padding:24px 16px;
  align-items:center;
  justify-content:center;
  box-sizing:border-box;
  background:#101426;
  color:#fff;
  font-family:inherit;
}
body.auth-ready:not(.authenticated) #aboud-auth {
  display:flex;
}
#aboud-auth * { box-sizing:border-box; }
.auth-box {
  width:min(440px,100%);
  padding:24px;
  background:#171b30;
  border:1px solid #63513a;
  border-radius:22px;
}
.auth-box h1 {
  color:#f5c76a;
  text-align:center;
}
.auth-box p {
  text-align:center;
  color:#aab1c8;
}
.auth-box label {
  display:block;
  margin:12px 0 6px;
}
.auth-box input {
  width:100%;
  padding:13px;
  border-radius:12px;
  border:1px solid #303752;
  background:#101528;
  color:white;
}
.auth-box button {
  padding:12px;
  border:0;
  border-radius:12px;
  cursor:pointer;
}
.auth-switch {
  display:flex;
  gap:8px;
  margin:16px 0;
}
.auth-switch button {
  flex:1;
  background:#202640;
  color:white;
}
.auth-switch button.selected {
  color:#f5c76a;
  border:1px solid #f5c76a;
}
.auth-primary {
  width:100%;
  margin-top:16px;
  background:#e8b85d;
  color:#24190c;
  font-weight:bold;
}
.auth-link {
  background:transparent;
  color:#f5c76a;
}
.auth-message {
  color:#ffe1a2;
  text-align:center;
  font-size:13px;
  line-height:1.7;
}
`;
document.head.appendChild(style);

const root = document.createElement("section");
root.id = "aboud-auth";
root.dir = "rtl";
root.innerHTML = `
  <div class="auth-box">
    <h1>👑 ABOUDSWO</h1>
    <p>مجتمعك.. صوتك.. عالمك</p>

    <div class="auth-switch">
      <button type="button" data-mode="login" class="selected">
        تسجيل الدخول
      </button>
      <button type="button" data-mode="signup">
        إنشاء حساب
      </button>
    </div>

    <form id="auth-form">
      <label>البريد الإلكتروني</label>
      <input id="auth-email" type="email"
        autocomplete="email" required
        placeholder="name@example.com">

      <div id="password-area">
        <label>كلمة المرور</label>
        <input id="auth-password" type="password"
          minlength="8" autocomplete="current-password">
      </div>

      <div id="confirm-area" hidden>
        <label>تأكيد كلمة المرور</label>
        <input id="auth-confirm" type="password"
          minlength="8" autocomplete="new-password">
      </div>

      <button class="auth-primary" id="auth-submit" type="submit">
        دخول إلى التطبيق
      </button>
    </form>

    <div style="text-align:center">
      <button type="button" class="auth-link" id="auth-forgot">
        نسيت كلمة المرور؟
      </button>
    </div>

    <div class="auth-message" id="auth-message"
      role="status" aria-live="polite"></div>
    <p>قد يُطلب منك تأكيد بريدك الإلكتروني قبل الدخول.</p>
  </div>
`;

document.body.prepend(root);

const form = document.getElementById("auth-form");
const email = document.getElementById("auth-email");
const password = document.getElementById("auth-password");
const confirmPassword = document.getElementById("auth-confirm");
const passwordArea = document.getElementById("password-area");
const confirmArea = document.getElementById("confirm-area");
const submit = document.getElementById("auth-submit");
const message = document.getElementById("auth-message");
const forgot = document.getElementById("auth-forgot");

let mode = "login";

function say(text) {
  message.textContent = text || "";
}

function setMode(value) {
  mode = value;

  root.querySelectorAll("[data-mode]").forEach(button => {
    button.hidden = mode === "reset" || mode === "update";
    button.classList.toggle(
      "selected",
      button.dataset.mode === mode
    );
  });

  passwordArea.hidden = mode === "reset";
  confirmArea.hidden = !(mode === "signup" || mode === "update");
  forgot.hidden = mode !== "login";

  password.required = mode !== "reset";
  confirmPassword.required =
    mode === "signup" || mode === "update";

  submit.textContent = {
    login: "دخول إلى التطبيق",
    signup: "إنشاء حساب",
    reset: "إرسال رابط الاستعادة",
    update: "حفظ كلمة المرور الجديدة"
  }[mode];

  password.value = "";
  confirmPassword.value = "";
  say("");
}

root.querySelectorAll("[data-mode]").forEach(button => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

forgot.addEventListener("click", () => setMode("reset"));

form.addEventListener("submit", async event => {
  event.preventDefault();

  const mail = email.value.trim().toLowerCase();
  const pass = password.value;
  const confirm = confirmPassword.value;

  submit.disabled = true;
  say("يرجى الانتظار...");

  try {
    if (mode === "signup" || mode === "update") {
      if (pass.length < 8) {
        throw new Error("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      }

      if (pass !== confirm) {
        throw new Error("كلمتا المرور غير متطابقتين.");
      }
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: mail,
        password: pass,
        options: {
          emailRedirectTo: SITE_URL
        }
      });

      if (error) throw error;

      if (data.session) {
        say("تم إنشاء الحساب.");
      } else {
        setMode("login");
        say("أرسلنا رابط تأكيد إلى بريدك الإلكتروني.");
      }
    }

    else if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: mail,
        password: pass
      });

      if (error) throw error;
      say("تم تسجيل الدخول.");
    }

    else if (mode === "reset") {
      const { error } =
        await supabase.auth.resetPasswordForEmail(mail, {
          redirectTo: SITE_URL
        });

      if (error) throw error;
      say("إذا كان البريد مسجلاً، ستصلك رسالة الاستعادة.");
    }

    else if (mode === "update") {
      const { error } = await supabase.auth.updateUser({
        password: pass
      });

      if (error) throw error;

      await supabase.auth.signOut();
      setMode("login");
      say("تم تحديث كلمة المرور. سجّل الدخول من جديد.");
    }
  } catch (error) {
    say(error.message || "حدث خطأ، حاول مرة أخرى.");
  } finally {
    submit.disabled = false;
  }
});

function addLogoutButton() {
  const profile = document.querySelector("#profile");
  if (!profile || document.getElementById("aboud-signout")) return;

  const button = document.createElement("button");
  button.id = "aboud-signout";
  button.className = "btn wide";
  button.textContent = "تسجيل الخروج";
  button.style.marginTop = "12px";

  button.addEventListener("click", async () => {
    button.disabled = true;

    const { error } = await supabase.auth.signOut();

    button.disabled = false;

    if (error) say(error.message);
  });

  profile.appendChild(button);
}

async function updateProfile(session) {
  const user = session?.user;
  const profile = document.querySelector("#profile .card.center");
  const headerCoins = document.getElementById("coinCount");

  if (!user) {
    if (headerCoins) headerCoins.textContent = "0";
    return;
  }

  const [profileResult, walletResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("coin_wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()
  ]);

  if (profileResult.error) {
    console.error("تعذر تحميل الملف الشخصي:", profileResult.error.message);
  }

  if (walletResult.error) {
    console.error("تعذر تحميل رصيد الكوينز:", walletResult.error.message);
  }

  if (profile) {
    const avatar = profile.querySelector(".avatar");
    const title = profile.querySelector("h2");
    const subtitle = profile.querySelector("p.muted");

    const displayName =
      profileResult.data?.display_name ||
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "عضو ABOUDSWO";

    if (avatar) {
      avatar.textContent = displayName.charAt(0).toUpperCase();
    }

    if (title) title.textContent = displayName;
    if (subtitle) subtitle.textContent = user.email || "";

    const note = document.querySelector("#profile .card p.small");

    if (note) {
      note.textContent = "حسابك مرتبط بقاعدة بيانات ABOUDSWO.";
    }
  }

  const balance = walletResult.data?.balance ?? 0;

  if (headerCoins) {
    headerCoins.textContent = String(balance);
  }
}

function applySession(session) {
  document.body.classList.add("auth-ready");

  document.body.classList.toggle(
    "authenticated",
    Boolean(session)
  );

  if (session) {
    addLogoutButton();
    void updateProfile(session);
  } else {
    void updateProfile(null);
  }
}

supabase.auth.onAuthStateChange((event, session) => {
  applySession(session);

  if (event === "PASSWORD_RECOVERY") {
    setMode("update");
    say("أدخل كلمة المرور الجديدة.");
  }
});

const { data, error } = await supabase.auth.getSession();

if (error) {
  say("تعذر التحقق من الجلسة. حدّث الصفحة وحاول مجدداً.");
}

applySession(data?.session || null);

if (window.location.hash.includes("type=recovery")) {
  setMode("update");
  say("أدخل كلمة المرور الجديدة.");
}
