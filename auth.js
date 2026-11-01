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

window.aboudswoSupabase = supabase;

const style = document.createElement("style");
style.textContent = `
body:not(.auth-ready) .app,
body:not(.auth-ready) .tabs,
body.auth-ready:not(.authenticated) .app,
body.auth-ready:not(.authenticated) .tabs { display:none!important; }

#aboud-auth {
  display:none; min-height:100vh; padding:24px 16px;
  align-items:center; justify-content:center; box-sizing:border-box;
  background:radial-gradient(circle at top,#38304e,#101326 65%);
  color:#fff; font-family:inherit;
}
body.auth-ready:not(.authenticated) #aboud-auth { display:flex; }
#aboud-auth * { box-sizing:border-box; }
.auth-box {
  width:min(440px,100%); padding:24px;
  background:#171b30; border:1px solid #8e6d3b; border-radius:22px;
  box-shadow:0 18px 60px #0007;
}
.auth-box h1 { color:#f5c76a; text-align:center; }
.auth-box p { text-align:center; color:#aab1c8; }
.auth-box label { display:block; margin:12px 0 6px; }
.auth-box input {
  width:100%; padding:13px; border-radius:12px;
  border:1px solid #303752; background:#101528; color:white;
}
.auth-box button { padding:12px; border:0; border-radius:12px; cursor:pointer; }
.auth-switch { display:flex; gap:8px; margin:16px 0; }
.auth-switch button { flex:1; background:#202640; color:white; }
.auth-switch button.selected { color:#f5c76a; border:1px solid #f5c76a; }
.auth-primary {
  width:100%; margin-top:16px; background:#e8b85d;
  color:#24190c; font-weight:bold;
}
.auth-link { background:transparent; color:#f5c76a; }
.auth-message { color:#ffe1a2; text-align:center; font-size:13px; line-height:1.7; }

#aboud-profile-editor { margin-top:12px; }
#aboud-profile-editor label { display:block; margin:12px 0 6px; }
#aboud-profile-editor input,
#aboud-profile-editor select {
  width:100%; padding:11px; border-radius:11px;
  border:1px solid #303752; background:#101528; color:#fff;
}
#aboud-profile-editor .profile-preview {
  display:flex; align-items:center; gap:12px; margin-bottom:12px;
}
#aboud-profile-editor .preview-avatar {
  width:58px; height:58px; border-radius:50%; object-fit:cover;
  display:grid; place-items:center; background:#303752;
  border:3px solid #f5c76a; font-size:23px; font-weight:800;
}
#aboud-profile-editor .editor-hint { color:#aab1c8; font-size:11px; line-height:1.6; }
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
      <button type="button" data-mode="login" class="selected">تسجيل الدخول</button>
      <button type="button" data-mode="signup">إنشاء حساب</button>
    </div>
    <form id="auth-form">
      <label for="auth-email">البريد الإلكتروني</label>
      <input id="auth-email" type="email" autocomplete="email" required placeholder="name@example.com">
      <div id="password-area">
        <label for="auth-password">كلمة المرور</label>
        <input id="auth-password" type="password" minlength="8" autocomplete="current-password">
      </div>
      <div id="confirm-area" hidden>
        <label for="auth-confirm">تأكيد كلمة المرور</label>
        <input id="auth-confirm" type="password" minlength="8" autocomplete="new-password">
      </div>
      <button class="auth-primary" id="auth-submit" type="submit">دخول إلى التطبيق</button>
    </form>
    <div style="text-align:center">
      <button type="button" class="auth-link" id="auth-forgot">نسيت كلمة المرور؟</button>
    </div>
    <div class="auth-message" id="auth-message" role="status" aria-live="polite"></div>
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
    button.classList.toggle("selected", button.dataset.mode === mode);
  });

  passwordArea.hidden = mode === "reset";
  confirmArea.hidden = !(mode === "signup" || mode === "update");
  forgot.hidden = mode !== "login";
  password.required = mode !== "reset";
  confirmPassword.required = mode === "signup" || mode === "update";

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
    if ((mode === "signup" || mode === "update") && pass.length < 8) {
      throw new Error("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
    }
    if ((mode === "signup" || mode === "update") && pass !== confirm) {
      throw new Error("كلمتا المرور غير متطابقتين.");
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: mail,
        password: pass,
        options: { emailRedirectTo: SITE_URL }
      });
      if (error) throw error;

      if (data.session) say("تم إنشاء الحساب.");
      else {
        setMode("login");
        say("أرسلنا رابط تأكيد إلى بريدك الإلكتروني.");
      }
    } else if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: mail,
        password: pass
      });
      if (error) throw error;
      say("تم تسجيل الدخول.");
    } else if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(mail, {
        redirectTo: SITE_URL
      });
      if (error) throw error;
      say("إذا كان البريد مسجلاً، ستصلك رسالة الاستعادة.");
    } else if (mode === "update") {
      const { error } = await supabase.auth.updateUser({ password: pass });
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
  button.className = "btn secondary wide";
  button.style.marginTop = "12px";
  button.textContent = "تسجيل الخروج";
  button.addEventListener("click", async () => {
    button.disabled = true;
    const { error } = await supabase.auth.signOut();
    button.disabled = false;
    if (error) say(error.message);
  });
  profile.appendChild(button);
}

function ensureProfileEditor() {
  const profile = document.getElementById("profile");
  if (!profile || document.getElementById("aboud-profile-editor")) return;

  const card = document.createElement("div");
  card.id = "aboud-profile-editor";
  card.className = "card";
  card.innerHTML = `
    <h3>✨ تخصيص الحساب</h3>
    <div class="profile-preview">
      <img class="preview-avatar" id="aboud-avatar-preview" alt="معاينة الصورة" hidden>
      <div class="preview-avatar" id="aboud-avatar-letter">A</div>
      <div>
        <b id="aboud-name-preview">عضو ABOUDSWO</b>
        <div class="editor-hint">معاينة الاسم والإطار</div>
      </div>
    </div>
    <label for="aboud-display-name">الاسم الظاهر</label>
    <input id="aboud-display-name" maxlength="30" placeholder="اكتب اسمك">
    <label for="aboud-avatar-file">صورة الحساب</label>
    <input id="aboud-avatar-file" type="file" accept="image/png,image/jpeg,image/webp">
    <label for="aboud-name-color">لون الاسم</label>
    <select id="aboud-name-color">
      <option value="#f5c76a">ذهبي ملكي</option>
      <option value="#ffffff">أبيض</option>
      <option value="#78d6ff">أزرق سماوي</option>
      <option value="#f18ac0">وردي</option>
      <option value="#9de6a8">أخضر</option>
      <option value="#c5a6ff">بنفسجي</option>
    </select>
    <label for="aboud-name-frame">إطار الاسم</label>
    <select id="aboud-name-frame">
      <option value="royal">👑 ملكي</option>
      <option value="silver">❄️ فضي</option>
      <option value="rose">🌹 وردي</option>
      <option value="none">بدون إطار</option>
    </select>
    <button class="btn wide" id="aboud-save-profile" style="margin-top:14px">حفظ التغييرات</button>
    <p class="editor-hint">الصورة تُرفع إلى Storage، والاسم والتنسيق يُحفظان في جدول profiles.</p>
    <p class="auth-message" id="aboud-profile-message" role="status"></p>
  `;
  profile.appendChild(card);

  const nameInput = card.querySelector("#aboud-display-name");
  const colorInput = card.querySelector("#aboud-name-color");
  const frameInput = card.querySelector("#aboud-name-frame");

  function preview() {
    const name = nameInput.value.trim() || "عضو ABOUDSWO";
    const previewName = card.querySelector("#aboud-name-preview");
    previewName.textContent = name;
    previewName.style.color = colorInput.value;
    previewName.style.textShadow =
      frameInput.value === "royal" ? "0 0 10px #f5c76a88" :
      frameInput.value === "silver" ? "0 0 10px #d9e3f088" :
      frameInput.value === "rose" ? "0 0 10px #ef78aa88" : "none";

    const letter = card.querySelector("#aboud-avatar-letter");
    letter.textContent = name.charAt(0).toUpperCase();
  }

  nameInput.addEventListener("input", preview);
  colorInput.addEventListener("change", preview);
  frameInput.addEventListener("change", preview);

  card.querySelector("#aboud-save-profile").addEventListener("click", saveProfile);
}

async function saveProfile() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return showProfileMessage("سجّل الدخول أولاً.");

  const card = document.getElementById("aboud-profile-editor");
  const button = card.querySelector("#aboud-save-profile");
  const message = card.querySelector("#aboud-profile-message");
  const displayName = card.querySelector("#aboud-display-name").value.trim();
  const nameColor = card.querySelector("#aboud-name-color").value;
  const nameFrame = card.querySelector("#aboud-name-frame").value;
  const file = card.querySelector("#aboud-avatar-file").files[0];

  if (!displayName) return message.textContent = "اكتب الاسم أولاً.";
  if (displayName.length > 30) return message.textContent = "الاسم طويل جداً.";

  button.disabled = true;
  message.textContent = "جارٍ حفظ الحساب...";

  try {
    let avatarUrl;

    if (file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error("اختر صورة PNG أو JPG أو WEBP.");
      }
      if (file.size > 3 * 1024 * 1024) {
        throw new Error("حجم الصورة يجب ألا يتجاوز 3 ميغابايت.");
      }

      const extension = file.type === "image/png" ? "png" :
        file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = data.publicUrl;
    }

    const updates = {
      id: user.id,
      display_name: displayName,
      name_color: nameColor,
      name_frame: nameFrame,
      updated_at: new Date().toISOString()
    };
    if (avatarUrl) updates.avatar_url = avatarUrl;

    const { error } = await supabase.from("profiles").upsert(updates, { onConflict: "id" });
    if (error) throw error;

    await updateProfile({ user });
    message.textContent = "تم حفظ بيانات الحساب.";
  } catch (error) {
    console.error("Profile save error:", error);
    message.textContent = error.message || "تعذر حفظ الملف الشخصي.";
  } finally {
    button.disabled = false;
  }
}

function showProfileMessage(text) {
  const el = document.getElementById("aboud-profile-message");
  if (el) el.textContent = text;
}

async function updateProfile(session) {
  const user = session?.user;
  const headerCoins = document.getElementById("coinCount");
  if (!user) {
    if (headerCoins) headerCoins.textContent = "0";
    return;
  }

  const [profileResult, walletResult] = await Promise.all([
    supabase.from("profiles")
      .select("display_name, avatar_url, name_color, name_frame")
      .eq("id", user.id).maybeSingle(),
    supabase.from("coin_wallets")
      .select("balance").eq("user_id", user.id).maybeSingle()
  ]);

  if (profileResult.error) console.error("Profile load error:", profileResult.error.message);
  if (walletResult.error) console.error("Wallet load error:", walletResult.error.message);

  const profileData = profileResult.data || {};
  const displayName = profileData.display_name ||
    user.user_metadata?.display_name || user.email?.split("@")[0] || "عضو ABOUDSWO";
  const avatarUrl = profileData.avatar_url || "";
  const nameColor = profileData.name_color || "#f5c76a";
  const nameFrame = profileData.name_frame || "royal";

  const profileCard = document.querySelector("#profile .card.center");
  if (profileCard) {
    const avatar = profileCard.querySelector(".avatar");
    const title = profileCard.querySelector("#profileName");
    const subtitle = profileCard.querySelector("#profileEmail");

    if (avatar) {
      avatar.textContent = avatarUrl ? "" : displayName.charAt(0).toUpperCase();
      avatar.style.backgroundImage = avatarUrl ? `url("${avatarUrl}")` : "";
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
      avatar.style.border = nameFrame === "none" ? "0" :
        `3px solid ${nameFrame === "silver" ? "#d9e3f0" :
          nameFrame === "rose" ? "#ef78aa" : "#f5c76a"}`;
    }
    if (title) {
      title.textContent = displayName;
      title.style.color = nameColor;
      title.style.textShadow = nameFrame === "none" ? "none" :
        `0 0 10px ${nameColor}55`;
    }
    if (subtitle) subtitle.textContent = user.email || "";
  }

  const editor = document.getElementById("aboud-profile-editor");
  if (editor) {
    editor.querySelector("#aboud-display-name").value = displayName;
    editor.querySelector("#aboud-name-color").value = nameColor;
    editor.querySelector("#aboud-name-frame").value = nameFrame;

    const preview = editor.querySelector("#aboud-avatar-preview");
    const letter = editor.querySelector("#aboud-avatar-letter");
    if (avatarUrl) {
      preview.src = avatarUrl;
      preview.hidden = false;
      letter.hidden = true;
    } else {
      preview.hidden = true;
      letter.hidden = false;
      letter.textContent = displayName.charAt(0).toUpperCase();
    }
    editor.querySelector("#aboud-name-preview").textContent = displayName;
    editor.querySelector("#aboud-name-preview").style.color = nameColor;
  }

  const balance = walletResult.data?.balance ?? 0;
  if (headerCoins) headerCoins.textContent = String(balance);
  const profileCoins = document.getElementById("profileCoins");
  if (profileCoins) profileCoins.textContent = String(balance);
}

function applySession(session) {
  document.body.classList.add("auth-ready");
  document.body.classList.toggle("authenticated", Boolean(session));

  if (session) {
    addLogoutButton();
    ensureProfileEditor();
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
if (error) say("تعذر التحقق من الجلسة. حدّث الصفحة وحاول مجدداً.");
applySession(data?.session || null);

if (window.location.hash.includes("type=recovery")) {
  setMode("update");
  say("أدخل كلمة المرور الجديدة.");
}
