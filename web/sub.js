// نظام الاشتراك: الطلب بينبعت مشفّر لصاحب التطبيق، والتفعيل بيرجع موقّع بمفتاحه (ما حدا بيقدر يزوّره)
const SUB = {
  signPub: { x: "ThEo0Sk9DvnOkqrIiVI754s4aPPWBTk7PW0qGstz9E4", y: "uFyFKyZtg5sXSY3s-jx3P8dKjYRXJd8xFHLLFQa-rOU" },
  dhPub: { x: "kfRSHt6o3Cww6AjS9O5XsHdLfQovchIAupwYW8aWKvw", y: "VyOSTCvGazZkaAfd0Eik7715Gf3tMoo7OnKSBoHgyIg" },
  reqTopic: "harira-req-3bd3211bb1a8ac82",
  actPrefix: "harira-act-",
  actsTopic: "harira-acts-421447b9281ebd95", // نسخة من كل تفعيل، بتنجمع بملف دائم subs.json
  usersTopic: "harira-users-56e050312e004ecf", // تسجيل المستخدمين (مشفّر للأدمن)، بينجمع بملف دائم users.json
  ntfy: "https://ntfy.sh/",
  wallet: "a36711eeff08f6ce348f796383159a22",
  trialDays: 3,
  config: { price: "", currency: "ل.س", whatsapp: "" },
};
fetch("config.json", { cache: "no-cache" }).then(r => r.json()).then(c => { Object.assign(SUB.config, c); if (typeof render === "function" && !document.querySelector(".sheet-bg")) render(); }).catch(() => {});

const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const utf8 = s => new TextEncoder().encode(s);

// ===== الحسابات: الاشتراك مربوط بالحساب (إيميل + كلمة سر)، فبيمشي معك لأي موبايل =====
function getAccount() { try { return JSON.parse(localStorage.getItem("harira-account") || "null"); } catch (e) { return null; } }
const isAdmin = () => { try { return !!localStorage.getItem("harira-admin"); } catch (e) { return false; } };
async function pbkdf2(pass, saltBytes, it, bytes) {
  const k = await crypto.subtle.importKey("raw", utf8(pass), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations: it }, k, bytes * 8));
}
const hex = u8 => Array.from(u8, b => b.toString(16).padStart(2, "0")).join("");
async function sha256hex(s) { return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", utf8(s)))); }
async function login(emailRaw, pass, name) {
  const email = String(emailRaw).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("اكتب إيميل صحيح");
  if (String(pass).length < 6) throw new Error("كلمة السر لازم تكون ٦ أحرف أو أكتر");
  // الأدمن: مفاتيح الإدارة مشفّرة بكلمة سره، وما بتنفتح إلا بالإيميل وكلمة السر الصح
  try {
    const ak = await (await fetch("admin-keys.json", { cache: "no-cache" })).json();
    if (ak.eh === await sha256hex(email)) {
      const key = await crypto.subtle.importKey("raw", await pbkdf2(pass, new Uint8Array([...unb64u(ak.salt), ...utf8(email)]), ak.it, 32), "AES-GCM", false, ["decrypt"]);
      let keys;
      try { keys = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(ak.iv) }, key, unb64u(ak.ct)))); }
      catch (e) { throw new Error("كلمة السر غلط"); }
      localStorage.setItem("harira-admin", JSON.stringify(keys));
    }
  } catch (e) { if (e.message === "كلمة السر غلط") throw e; }
  const id = hex((await pbkdf2(pass, utf8("harira:" + email), 150000, 10)));
  localStorage.setItem("harira-account", JSON.stringify({ email, id, name: String(name || "").trim() }));
  ["harira-sub", "harira-sub-cache", "harira-req", "harira-reg"].forEach(k => localStorage.removeItem(k));
  if (!isAdmin()) registerUser();
  return { admin: isAdmin() };
}
// منعرّف الأدمن على كل مستخدم (اسمه وإيميله) مشفّر، متل لوحة نبض: بيشوف الكل وبيقدر يهديه اشتراك
async function registerUser(extra) {
  const acc = getAccount(); if (!acc || !acc.id || isAdmin()) return;
  let first = Date.now(); try { first = +localStorage.getItem("harira-first") || first; } catch (e) {}
  const info = { t: "reg", id: acc.id, email: acc.email, name: acc.name || "", first, ts: Date.now(), ...(extra || {}) };
  const sig = JSON.stringify([info.email, info.name, info.phone || ""]);
  try { if (!extra && localStorage.getItem("harira-reg") === sig) return; } catch (e) {}
  try {
    const r = await fetch(SUB.ntfy + SUB.usersTopic, { method: "POST", body: await encryptForAdmin(info) });
    if (r.ok) try { localStorage.setItem("harira-reg", sig); } catch (e) {}
  } catch (e) {}
}
function logout() { ["harira-account", "harira-admin", "harira-sub", "harira-sub-cache", "harira-req", "harira-outbox"].forEach(k => { try { localStorage.removeItem(k); } catch (e) {} }); }

// كود الحساب (أو كود الجهاز قبل تسجيل الدخول)
function deviceId() {
  const acc = getAccount(); if (acc && acc.id) return acc.id;
  try { if (window.AndroidApp && AndroidApp.deviceId) { const d = AndroidApp.deviceId(); if (d) return d; } } catch (e) {}
  let d = null; try { d = localStorage.getItem("harira-dev"); } catch (e) {}
  if (!d) { d = Array.from(crypto.getRandomValues(new Uint8Array(10)), b => b.toString(16).padStart(2, "0")).join(""); try { localStorage.setItem("harira-dev", d); } catch (e) {} }
  return d;
}
const shortCode = id => id.slice(0, 4).toUpperCase() + "-" + id.slice(4, 8).toUpperCase() + "-" + id.slice(8, 12).toUpperCase();

// تشفير الطلب بمفتاح صاحب التطبيق (ECDH + AES-GCM)
async function encryptForAdmin(obj) {
  const adminPub = await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", ...SUB.dhPub, ext: true }, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const eph = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "ECDH", public: adminPub }, eph.privateKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, utf8(JSON.stringify(obj)));
  const epk = await crypto.subtle.exportKey("jwk", eph.publicKey);
  return JSON.stringify({ v: 1, epk: { x: epk.x, y: epk.y }, iv: b64u(iv), ct: b64u(ct) });
}

// التحقق من كود التفعيل الموقّع
async function verifyToken(token) {
  try {
    const [p, s] = String(token).trim().split(".");
    const pub = await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", ...SUB.signPub, ext: true }, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pub, unb64u(s), utf8(p));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(unb64u(p)));
    return data.id === deviceId() ? data : null;
  } catch (e) { return null; }
}

// حالة الاشتراك
const subState = { active: false, lifetime: false, exp: 0, trialEnds: 0, checked: false };
function trialEnds() {
  let t = 0; try { t = +localStorage.getItem("harira-first") || 0; } catch (e) {}
  if (!t) { t = Date.now(); try { localStorage.setItem("harira-first", t); } catch (e) {} }
  return t + SUB.trialDays * 864e5;
}
async function refreshSub() {
  subState.trialEnds = trialEnds();
try { const c = JSON.parse(localStorage.getItem("harira-sub-cache") || "null"); if (c && (c.exp === 0 || c.exp > Date.now())) Object.assign(subState, { active: true, lifetime: c.exp === 0, exp: c.exp }); } catch (e) {}
  let tok = null; try { tok = localStorage.getItem("harira-sub"); } catch (e) {}
  const d = tok ? await verifyToken(tok) : null;
  subState.active = !!(d && d.t === "ok" && (d.exp === 0 || d.exp > Date.now()));
  subState.lifetime = !!(d && d.exp === 0);
  subState.exp = d ? d.exp : 0;
  subState.plan = d ? d.plan : "";
  subState.checked = true;
  try { localStorage.setItem("harira-sub-cache", JSON.stringify(subState.active ? { exp: subState.exp } : null)); } catch (e) {}
  return subState;
}
subState.trialEnds = trialEnds();
try { const c = JSON.parse(localStorage.getItem("harira-sub-cache") || "null"); if (c && (c.exp === 0 || c.exp > Date.now())) Object.assign(subState, { active: true, lifetime: c.exp === 0, exp: c.exp }); } catch (e) {}
const isPremium = () => subState.active || isAdmin() || (subState.plan !== "stop" && Date.now() < subState.trialEnds); // الإيقاف من الأدمن بيلغي التجربة كمان
const inTrial = () => !subState.active && subState.plan !== "stop" && Date.now() < subState.trialEnds;

async function applyToken(token) {
  const d = await verifyToken(token);
  if (!d) return { ok: false };
  if (d.t === "rej") { saveReq({ status: "rejected", why: d.why || "", at: d.iat }); return { ok: true, rejected: true, d }; }
  // ما منرجع لاشتراك أقدم من الموجود
  let cur = null; try { cur = await verifyToken(localStorage.getItem("harira-sub")); } catch (e) {}
  if (cur && cur.t === "ok" && cur.iat > d.iat) return { ok: true, d: cur };
  try { localStorage.setItem("harira-sub", token.trim()); } catch (e) {}
  saveReq({ status: "approved", at: d.iat });
  await refreshSub();
  return { ok: true, d };
}

// الطلبات
function getReq() { try { return JSON.parse(localStorage.getItem("harira-req") || "null"); } catch (e) { return null; } }
function saveReq(patch) { const r = Object.assign(getReq() || {}, patch); try { localStorage.setItem("harira-req", JSON.stringify(r)); } catch (e) {} return r; }

function shrinkTo(file, max, q) {
  return new Promise((ok, bad) => {
    const img = new Image();
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", q)); };
    img.onerror = () => bad(new Error("ما قدرت افتح صورة الإيصال"));
    img.src = URL.createObjectURL(file);
  });
}
async function sendSubRequest({ name, phone, plan, file }) {
  const receipt = await shrinkTo(file, 900, 0.72);
  const id = deviceId();
  const acc = getAccount() || {};
  const body = await encryptForAdmin({ t: "req", id, name, phone, email: acc.email || "", plan, ts: Date.now(), receipt, lang: typeof LANG !== "undefined" ? LANG : "ar" });
  const url = SUB.ntfy + SUB.reqTopic + "?title=" + encodeURIComponent("Harira") + "&message=" + encodeURIComponent("New subscription request") + "&filename=req.json";
  const r = await fetch(url, { method: "PUT", body });
  if (!r.ok) throw new Error("ما قدرت ابعت الطلب. تأكد من النت وجرب كمان مرة.");
  saveReq({ status: "pending", ts: Date.now(), name, phone, plan, body }); // منحتفظ فيه لنعيد بعته إذا تأخر الرد
  registerUser({ name, phone });
  return true;
}
// إذا الطلب ضل معلّق أكتر من ٦ ساعات، منعيد بعته (رسائل الخدمة بتنحفظ ١٢ ساعة بس)
async function resendIfStale() {
  const r = getReq();
  if (!r || r.status !== "pending" || !r.body || Date.now() - (r.sent || r.ts) < 6 * 36e5) return;
  try {
    await fetch(SUB.ntfy + SUB.reqTopic + "?title=Harira&message=" + encodeURIComponent("Subscription request (resent)") + "&filename=req.json", { method: "PUT", body: r.body });
    saveReq({ sent: Date.now() });
  } catch (e) {}
}
// الرد من صاحب التطبيق: فوري على قناة الحساب، ودائم بملف subs.json (لما تسجل دخول من موبايل تاني)
async function pollActivation() {
  let changed = false;
  try {
    const all = await (await fetch("subs.json", { cache: "no-cache" })).json();
    const mine = all[deviceId()];
    if (mine && (await applyToken(mine)).ok) changed = true;
  } catch (e) {}
  try {
    const res = await fetch(SUB.ntfy + SUB.actPrefix + deviceId() + "/json?poll=1&since=all");
    const lines = (await res.text()).split("\n").filter(Boolean);
    for (const l of lines) {
      let m; try { m = JSON.parse(l); } catch (e) { continue; }
      if (m.event !== "message" || !m.message) continue;
      const out = await applyToken(m.message);
      if (out.ok) changed = true;
    }
    return changed;
  } catch (e) { return changed; }
}
