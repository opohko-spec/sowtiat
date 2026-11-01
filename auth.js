import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://toosuyejhjevaxmqzwkv.supabase.co";
const SUPABASE_KEY = "sb_publishable_0ZBINmMPhDTNZjJ_nYC7Gg_hWUZTYHL";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
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
#ab-auth .message{min-height:22px;margin-top:12px;color:#f2d994;font-size:13px}
#ab-logout{background:#24211b;color:#f2d994;border:1px solid #80632b;
padding:8px 12px;border-radius:9px;cursor:pointer;margin:8px}
`;
document.head.appendChild(style);

function showAuth() {
  document.getElementById("ab-auth")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "ab-auth";
  overlay.innerHTML = `
    <div class="panel">
      <div class="crown">♛</div>
      <h2>عبود الملك</h2>
      <p>اكتب اسمك للدخول</p>
      <input id="ab-username" placeholder="اسم المستخدم"
        autocomplete="nickname" maxlength="20">
      <button id="ab-submit">دخول</button>
      <div class="message" id="ab-message"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector("#ab-username");
  const button = overlay.querySelector("#ab-submit");
  const message = overlay.querySelector("#ab-message");

  button.onclick = async () => {
    const username = input.value.trim();

    if (username.length < 2 || username.length > 20) {
      message.textContent = "اكتب اسمًا من حرفين إلى 20 حرفًا";
      return;
    }

    button.disabled = true;
    message.textContent = "جارٍ الدخول...";

    try {
      const { data, error } = await supabase.auth.signInAnonymously({
        options: { data: { username, display_name: username } }
      });

      if (error) throw error;
      if (!data.user) throw new Error("تعذر إنشاء جلسة الدخول");

      const { error: updateError } = await supabase.auth.updateUser({
        data: { username, display_name: username }
      });

      if (updateError) throw updateError;

      overlay.remove();
      await onAuthenticated(data.user);
    } catch (error) {
      message.textContent = error.message || "تعذر الدخول، حاول مرة أخرى";
      button.disabled = false;
    }
  };

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") button.click();
  });
}

async function onAuthenticated(user) {
  if (!user) return;

  const name =
    user.user_metadata?.display_name ||
    user.user_metadata?.username ||
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
    if (error) {
      alert("تعذر تسجيل الخروج: " + error.message);
      return;
    }
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
