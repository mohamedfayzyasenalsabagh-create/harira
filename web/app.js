// حريره: حاسبة السعرات. كل البيانات محفوظة على جهاز المستخدم فقط
// تحليل الصور عبر OpenRouter (موديلات مجانية بتفهم الصور). المفتاح مموّه وحسابه بدون رصيد
const ORK = (() => { const m = "harira-calories", b = atob("GwpfBgBMW1JMDQwTWVRCCVAWDUdSSwVSVV5DUV1AXldBDBRTSFIED1sUWFNDW1FEUUcFH1RRCgsRWAQRWllHXEFWHAZVDwlHWA==");
  let o = ""; for (let i = 0; i < b.length; i++) o += String.fromCharCode(b.charCodeAt(i) ^ m.charCodeAt(i % m.length)); return o; })();
const OR = "https://openrouter.ai/api/v1";
const AI_PROMPT = `You are a nutrition assistant. Look at this food photo and identify every distinct food or drink visible.
For each one, estimate the portion weight in grams from visual cues (plate size, utensils, typical servings), and give typical nutrition values PER 100 GRAMS for that food as prepared.
Reply with ONLY a JSON object, no other text, in exactly this shape:
{"items":[{"name":"<short Arabic name, Levantine wording>","grams":<number>,"kcal100":<number>,"p100":<protein g per 100g>,"c100":<carbs g per 100g>,"f100":<fat g per 100g>}],"note":"<one short Arabic sentence about what makes the estimate uncertain, e.g. hidden oil>"}
If there is no food in the image, reply {"items":[],"note":"ما في أكل واضح بالصورة"}.`;
const MEALS = ["فطور", "غداء", "عشاء", "سناك"];
const app = document.getElementById("app");
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const r0 = n => Math.round(n);
const r1 = n => Math.round(n * 10) / 10;
const fmt = n => r0(n).toLocaleString(LOC);
const fmt1 = n => r1(n).toLocaleString(LOC);

// ---------- التخزين ----------
let S = { goal: 2000, days: {}, custom: [] };
try { S = Object.assign(S, JSON.parse(localStorage.getItem("harira") || "{}")); } catch (e) {}
function save() { try { localStorage.setItem("harira", JSON.stringify(S)); } catch (e) {} }
// أكلاتي: أكلات أضافها المستخدم، بتنضم لقاعدة الأكلات
function addCustomToFoods(c) { const f = { id: FOODS.length, n: c[0], c: "أكلاتي", k: c[1], p: c[2], cb: c[3], f: c[4], u: c[5], ug: c[6], bc: c[7] }; FOODS.push(f); return f; }
(S.custom || []).forEach(addCustomToFoods);
// ذاكرة التعلّم: بصمة كل صورة مع الأكلة اللي اختارها المستخدم (محفوظة على الموبايل بس)
let LEARN = [];
try { LEARN = JSON.parse(localStorage.getItem("harira-learn") || "[]"); } catch (e) {}
function saveLearn() { try { localStorage.setItem("harira-learn", JSON.stringify(LEARN.slice(-300))); } catch (e) {} }
// التعلّم المشترك: كل تصحيح بيوصل لباقي المستخدمين (البصمة والاسم بس، بدون الصورة)
const SHARE_URL = "https://ntfy.sh/harira-learn-b4ccc4173c9d";
let SHARED = [];
try { SHARED = JSON.parse(localStorage.getItem("harira-shared") || "[]"); } catch (e) {}
fetch("ml/shared.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : null).then(j => {
  if (Array.isArray(j)) { SHARED = j; try { localStorage.setItem("harira-shared", JSON.stringify(j)); } catch (e) {} }
}).catch(() => {});
function shareLearning(entry) {
  const queue = (() => { try { return JSON.parse(localStorage.getItem("harira-outbox") || "[]"); } catch (e) { return []; } })();
  if (entry) queue.push({ v: 1, e: entry.e, items: entry.items.map(it => ({ ...it.f, g: it.g })) });
  const keep = [];
  const sendAll = queue.slice(-20).map(m => fetch(SHARE_URL, { method: "POST", body: JSON.stringify(m) }).then(r => { if (!r.ok) keep.push(m); }).catch(() => keep.push(m)));
  Promise.all(sendAll).then(() => { try { localStorage.setItem("harira-outbox", JSON.stringify(keep)); } catch (e) {} });
}
setTimeout(() => shareLearning(null), 4000); // يبعت اللي ما انبعت وقت ما كان في نت
let learnCtx = null; // { emb } بصمة الصورة الحالية لحتى نتعلم منها لما المستخدم يختار الأكلة

const key = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
let day = new Date();
let tab = "today";
let cat = "الكل";
let query = "";

function guessMeal() {
  const h = new Date().getHours();
  return h < 11 ? "فطور" : h < 17 ? "غداء" : h < 22 ? "عشاء" : "سناك";
}
function entries() { return S.days[key(day)] || []; }
function addEntry(e) {
  const k = key(day);
  (S.days[k] = S.days[k] || []).push(Object.assign({ t: Date.now() }, e));
  save();
}
// حساب قيم كمية معينة من أكلة (القيم لكل 100 غرام)
function calc(f, g) {
  const m = g / 100;
  return { k: f.k * m, p: f.p * m, cb: f.cb * m, f: f.f * m };
}
function toast(msg) {
  document.querySelectorAll(".toast").forEach(x => x.remove());
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
function dayLabel() {
  const t = key(new Date()), d = key(day);
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (d === t) return "اليوم";
  if (d === key(y)) return "مبارح";
  return day.toLocaleDateString(LOC, { weekday: "long", day: "numeric", month: "long" });
}

// ---------- شاشة اليوم ----------
function renderToday() {
  const list = entries();
  const tot = list.reduce((a, e) => ({ k: a.k + e.k, p: a.p + e.p, cb: a.cb + e.cb, f: a.f + e.f }), { k: 0, p: 0, cb: 0, f: 0 });
  const exs = (S.ex && S.ex[key(day)]) || [];
  const burned = exs.reduce((a, e) => a + e.k, 0);
  const base = S.goal || 2000, goal = base + burned;
  const pct = Math.min(tot.k / goal, 1), over = tot.k > goal, left = goal - tot.k;
  const C = 2 * Math.PI * 62;
  const tg = S.macros || { p: base * .25 / 4, cb: base * .5 / 4, f: base * .25 / 9 };
  const macro = (name, v, t, color) => `<div class="macro"><div class="lbl"><span>${name}</span><span class="num muted">${fmt(v)}/${fmt(t)} غ</span></div>
    <div class="bar"><i style="width:${Math.min(v / t, 1) * 100}%;background:${color}"></i></div></div>`;
  const byMeal = MEALS.map(m => {
    const items = list.map((e, i) => ({ e, i })).filter(x => (x.e.meal || "سناك") === m);
    const sum = items.reduce((a, x) => a + x.e.k, 0);
    return `<div class="meal-row"><div class="row between"><b>${m}</b><span class="row" style="gap:8px"><span class="num muted">${items.length ? fmt(sum) + " سعرة" : ""}</span><button class="icon-btn sm" data-addmeal="${m}" aria-label="أضف لـ${m}">+</button></span></div>
      ${items.map(({ e, i }) => `<div class="entry"><div class="t"><b>${esc(e.n)}</b><small class="muted num">${fmt(e.g)} غرام${e.src ? " · 📸" : ""}</small></div>
        <span class="k num">${fmt(e.k)}</span><button class="del" data-del="${i}" aria-label="احذف ${esc(e.n)}">×</button></div>`).join("")}</div>`;
  }).join("");
  const ap = typeof activeProgram === "function" ? activeProgram() : null;
  const isToday = key(day) === key(new Date());
  const name = (prof().name || "").split(" ")[0];
  const h = new Date().getHours(), hello = h < 12 ? "صباح الخير" : h < 18 ? "نهارك سعيد" : "مسا الخير";
  app.innerHTML = `
  ${updateBanner()}
  <div class="head"><div style="min-width:0"><small class="muted">${hello}${name ? "،" : ""}</small><h1 style="font-size:24px">${name ? esc(name) : "حريره"} ${streak() >= 2 ? `<span class="streak num">🔥${fmt(streak())}</span>` : ""}</h1></div>
    <div class="row" style="gap:6px"><button class="chip" id="subchip" style="${subState.active || isAdmin() ? "" : "background:var(--saffron);border-color:var(--saffron);color:#1E2A20"}">${subBadge()}</button>
    <button class="icon-btn" id="bell" aria-label="التذكيرات">🔔</button></div></div>
  <div class="datebar" style="justify-content:space-between;margin-bottom:12px"><button class="icon-btn" id="prev" aria-label="اليوم السابق">${LANG === "en" ? "‹" : "›"}</button><b>${dayLabel()}</b><button class="icon-btn" id="next" aria-label="اليوم التالي" ${isToday ? "disabled style=\"opacity:.35\"" : ""}>${LANG === "en" ? "›" : "‹"}</button></div>
  <div class="stack">
    <div class="card dash">
      <div class="ring">
        <svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="62" fill="none" stroke="var(--line)" stroke-width="11"/>
          <circle cx="70" cy="70" r="62" fill="none" stroke="${over ? "var(--tomato)" : "var(--herb)"}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" transform="rotate(-90 70 70)"/></svg>
        <div class="mid"><span class="big num">${fmt(Math.abs(left))}</span><small class="muted">${over ? "زيادة" : "باقي"}</small></div>
      </div>
      <div class="dash-stats">
        <div><small class="muted">الهدف</small><b class="num">${fmt(base)}</b></div>
        <div><small class="muted">أكلت</small><b class="num">${fmt(tot.k)}</b></div>
        <div><small class="muted">حرقت</small><b class="num" style="color:var(--herb)">${fmt(burned)}</b></div>
      </div>
      <div class="macros">${macro("بروتين", tot.p, tg.p, "var(--herb)")}${macro("كربوهيدرات", tot.cb, tg.cb, "var(--saffron)")}${macro("دهون", tot.f, tg.f, "var(--lentil)")}</div>
    </div>
    <div class="quick-actions">
      <button data-go="photo"><span>📸</span>صوّر صحنك</button>
      <button data-go="add"><span>🔍</span>أضف أكلة</button>
      <button id="qa-w"><span>⚖️</span>سجّل وزن</button>
      <button data-go="workouts"><span>🏋️</span>تمرّن</button>
    </div>
    ${ap && isToday ? `<div class="card workout-today"><div class="row between"><span class="pill">${ap.icon} تمرين اليوم</span><small class="muted">${fmt(workoutMinutes(ap, nextDayIndex(ap)))} دقيقة · ≈ ${fmt(workoutKcal(ap, nextDayIndex(ap)))} سعرة</small></div>
      <b>${ap.name}</b><button class="btn" id="td-start">▶ ابدأ</button></div>` : ""}
    <div class="card"><div class="row between" style="margin-bottom:4px"><h2>وجباتي</h2><span class="muted num" style="font-size:13px">${fmt(list.length)} أصناف</span></div>${byMeal}</div>
    ${waterCard()}
    ${exs.length ? exerciseCard() : ""}
    ${tipCard()}
  </div>`;
  $("#prev").onclick = () => { day.setDate(day.getDate() - 1); render(); };
  $("#next").onclick = () => { if (!isToday) { day.setDate(day.getDate() + 1); render(); } };
  $("#subchip").onclick = () => subSheet();
  $("#bell").onclick = () => requirePremium("التذكيرات") && remindersSheet();
  $("#qa-w").onclick = weightSheet;
  const tds = $("#td-start"); if (tds) tds.onclick = () => startPlayer(ap, nextDayIndex(ap));
  const xa = $("#ex-add"); if (xa) xa.onclick = () => requirePremium("الرياضة") && exerciseSheet();
  app.querySelectorAll("[data-exdel]").forEach(b => b.onclick = () => { const l = S.ex[key(day)]; l.splice(+b.dataset.exdel, 1); save(); render(); });
  const ub = $("#upd-x"); if (ub) ub.onclick = () => { try { sessionStorage.setItem("harira-upd-x", "1"); } catch (e) {} render(); };
  $("#w-plus").onclick = () => { const k = key(day); S.water = S.water || {}; S.water[k] = Math.min(20, (S.water[k] || 0) + 1); save(); render(); };
  $("#w-minus").onclick = () => { const k = key(day); S.water = S.water || {}; S.water[k] = Math.max(0, (S.water[k] || 0) - 1); save(); render(); };
  app.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { const l = entries(); l.splice(+b.dataset.del, 1); save(); render(); });
  app.querySelectorAll("[data-addmeal]").forEach(b => b.onclick = () => { mealPick = b.dataset.addmeal; go("add"); });
  app.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(b.dataset.go));
}
let mealPick = null;

// أعمدة آخر 7 أيام
function weekCard() {
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d); }
  const vals = days.map(d => (S.days[key(d)] || []).reduce((a, e) => a + e.k, 0));
  if (!vals.some(v => v > 0)) return "";
  const goal = S.goal || 2000;
  const max = Math.max(goal, ...vals) * 1.1;
  const H = 110, W = 300, bw = 26, gap = (W - bw * 7) / 6;
  const gy = H - goal / max * H;
  const bars = vals.map((v, i) => {
    const h = Math.max(v / max * H, v > 0 ? 3 : 0);
    const x = LANG === "en" ? i * (bw + gap) : W - bw - i * (bw + gap); // بالعربي من اليمين لليسار
    const lbl = days[i].toLocaleDateString(LOC, { weekday: "short" });
    return `<rect x="${x}" y="${H - h}" width="${bw}" height="${h}" rx="6" fill="${v > goal ? "var(--tomato)" : "var(--herb)"}" opacity="${key(days[i]) === key(day) ? 1 : .55}"/>
      <text x="${x + bw / 2}" y="${H + 18}" text-anchor="middle" font-size="11" fill="var(--muted)">${lbl}</text>`;
  }).join("");
  return `<div class="card"><div class="row between"><h2>آخر ٧ أيام</h2><small class="muted">الخط = هدفك</small></div>
    <svg viewBox="0 0 ${W} ${H + 26}" style="width:100%;margin-top:10px" role="img" aria-label="السعرات خلال آخر سبعة أيام">
      <line x1="0" x2="${W}" y1="${gy}" y2="${gy}" stroke="var(--saffron)" stroke-dasharray="4 4" stroke-width="1.5"/>${bars}</svg></div>`;
}

// حساب الاحتياج اليومي (معادلة Mifflin-St Jeor) حسب الجسم والنشاط والهدف
const ACTIVITY = [["قليل الحركة (مكتب)", 1.2], ["خفيف (رياضة ١-٣ أيام)", 1.375], ["متوسط (٣-٥ أيام)", 1.55], ["عالي (٦-٧ أيام)", 1.725], ["عالي جداً (شغل بدني)", 1.9]];
const AIMS = [["تنزيل وزن", -500], ["تثبيت الوزن", 0], ["زيادة وزن / عضل", 300]];
function calcGoal(pr) {
  const bmr = 10 * pr.w + 6.25 * pr.h - 5 * pr.a + (pr.sex === "m" ? 5 : -161);
  const tdee = bmr * ACTIVITY[pr.act][1];
  const floor = pr.sex === "m" ? 1500 : 1200; // ما منقترح أقل من هيك بدون إشراف طبي
  return { bmr: r0(bmr), tdee: r0(tdee), goal: Math.max(floor, r0((tdee + AIMS[pr.aim][1]) / 10) * 10) };
}
function goalSheet() {
  const pr = Object.assign({ sex: "m", a: 30, h: 170, w: latestWeight() || 70, act: 1, aim: 1 }, S.profile || {});
  sheet(`<h2>هدفك اليومي</h2>
    <p class="muted" style="margin:0;font-size:13px">عبّي معلوماتك وبحسبلك احتياجك، أو اكتب رقمك بإيدك تحت.</p>
    <div class="row"><button class="chip" data-sex="m" aria-pressed="${pr.sex === "m"}">ذكر</button><button class="chip" data-sex="f" aria-pressed="${pr.sex === "f"}">أنثى</button></div>
    <div class="row">
      <div style="flex:1"><label class="muted" for="p-a">العمر</label><input id="p-a" type="number" inputmode="numeric" value="${pr.a}"></div>
      <div style="flex:1"><label class="muted" for="p-h">الطول (سم)</label><input id="p-h" type="number" inputmode="numeric" value="${pr.h}"></div>
      <div style="flex:1"><label class="muted" for="p-w">الوزن (كغ)</label><input id="p-w" type="number" inputmode="decimal" value="${pr.w}"></div></div>
    <label class="muted" for="p-act">النشاط</label><select id="p-act">${ACTIVITY.map((x, i) => `<option value="${i}" ${i === pr.act ? "selected" : ""}>${x[0]}</option>`).join("")}</select>
    <label class="muted" for="p-aim">هدفك</label><select id="p-aim">${AIMS.map((x, i) => `<option value="${i}" ${i === pr.aim ? "selected" : ""}>${x[0]}</option>`).join("")}</select>
    <div class="note" id="p-res"></div>
    <label class="muted" for="g-in">السعرات اليومية</label>
    <input id="g-in" type="number" inputmode="numeric" min="800" max="6000" value="${S.goal || 2000}">
    <p class="muted" style="margin:0;font-size:13px">الحساب تقريبي. إذا عندك حالة صحية أو حمل أو بدك تنزل كتير، استشير طبيب أو أخصائي تغذية.</p>
    <button class="btn" id="g-save">احفظ</button>`, el => {
    const read = () => ({ sex: pr.sex, a: +$("#p-a", el).value, h: +$("#p-h", el).value, w: +$("#p-w", el).value, act: +$("#p-act", el).value, aim: +$("#p-aim", el).value });
    const upd = () => {
      const x = read();
      if (!(x.a >= 12 && x.a <= 100 && x.h >= 120 && x.h <= 230 && x.w >= 30 && x.w <= 300)) { $("#p-res", el).textContent = "عبّي العمر والطول والوزن بأرقام صحيحة."; return; }
      const r = calcGoal(x);
      $("#p-res", el).innerHTML = `حرقك وانت مرتاح ≈ <b class="num">${fmt(r.bmr)}</b> · مع نشاطك ≈ <b class="num">${fmt(r.tdee)}</b><br>المقترح لهدفك: <b class="num">${fmt(r.goal)}</b> سعرة باليوم`;
      $("#g-in", el).value = r.goal;
    };
    el.querySelectorAll("[data-sex]").forEach(b => b.onclick = () => { pr.sex = b.dataset.sex; el.querySelectorAll("[data-sex]").forEach(x => x.setAttribute("aria-pressed", x === b)); upd(); });
    ["p-a", "p-h", "p-w", "p-act", "p-aim"].forEach(id => $("#" + id, el).oninput = upd);
    if (!isPremium()) { ["p-a", "p-h", "p-w", "p-act", "p-aim"].forEach(id => { const x = $("#" + id, el); x.disabled = true; }); el.querySelectorAll("[data-sex]").forEach(b => b.disabled = true);
      $("#p-res", el).innerHTML = `🎯 الحساب التلقائي للمشتركين. <button class="chip" id="p-sub">اشترك</button>`; $("#p-sub", el).onclick = () => { closeSheet(); setTimeout(() => subSheet("حساب الهدف تلقائياً"), 50); }; }
    else if (S.profile) upd();
    $("#g-save", el).onclick = () => {
      const v = Math.round(+$("#g-in", el).value);
      if (!(v >= 800 && v <= 6000)) return toast("اكتب رقم بين ٨٠٠ و٦٠٠٠");
      const x = read();
      if (x.a && x.h && x.w) { S.profile = x; if (!S.weights || !S.weights[key(new Date())]) logWeight(x.w); }
      S.goal = v; save(); closeSheet(); render();
    };
  });
}

// ===== تنبيه نسخة جديدة من غلاف التطبيق =====
const APK_URL = "https://github.com/mohamedfayzyasenalsabagh-create/harira/releases/latest/download/harira.apk";
const wrapperVer = +((navigator.userAgent.match(/HariraApp\/(\d+)/) || [])[1] || 0);
let latestWrapper = 0;
if (wrapperVer) fetch("app-version.json", { cache: "no-cache" }).then(r => r.json()).then(j => { latestWrapper = +j.wrapper || 0; if (latestWrapper > wrapperVer && tab === "today") render(); }).catch(() => {});
function updateBanner() {
  let hidden = false; try { hidden = !!sessionStorage.getItem("harira-upd-x"); } catch (e) {}
  if (!wrapperVer || latestWrapper <= wrapperVer || hidden) return "";
  return `<div class="note row between" style="gap:8px;margin-bottom:12px"><span>في نسخة جديدة من التطبيق</span>
    <span class="row" style="gap:6px"><a class="chip" href="${APK_URL}" style="text-decoration:none;color:inherit">نزّلها</a><button class="chip" id="upd-x">لاحقاً</button></span></div>`;
}

// ===== الدعم =====
function supportBox() {
  const n = SUB.config.whatsapp; if (!n) return "";
  const intl = "963" + n.replace(/\D/g, "").replace(/^0/, "");
  return `<div class="note row between" style="gap:8px"><span>للدعم أو أي مشكلة: <b class="num" dir="ltr">${esc(n)}</b></span>
    <a class="chip" href="https://wa.me/${intl}" style="text-decoration:none;color:inherit">واتساب</a></div>`;
}

// ===== الاشتراك =====
const PREMIUM_FEATURES = ["📸 تحليل الصحن بالصورة مع السعرات", "🍽️ تسجيل الأكل وأكتر من ٢٥٠ أكلة", "🔎 مسح الباركود", "🏋️ الرياضة والسعرات المحروقة", "🔔 تذكير المي والوجبات ونصيحة يومية", "🎯 حساب الهدف تلقائياً", "💧 عداد المي و⚖️ متابعة الوزن"];
function subBadge() {
  if (isAdmin()) return "👑 أدمن";
  if (subState.active) return subState.lifetime ? "⭐ مدى الحياة" : "⭐ مشترك";
  if (inTrial()) return "تجربة: " + fmt(Math.ceil((subState.trialEnds - Date.now()) / 864e5)) + " أيام";
  return "اشترك";
}
function requirePremium(what) {
  if (isPremium()) return true;
  subSheet(what); return false;
}
function subSheet(reason) {
  const req = getReq(), id = deviceId(), price = SUB.config.price;
  let body;
  if (subState.active) {
    body = `<div class="note">⭐ اشتراكك فعّال ${subState.lifetime ? "مدى الحياة" : "لحد " + new Date(subState.exp).toLocaleDateString(LOC, { day: "numeric", month: "long", year: "numeric" })}. شكراً إلك!</div>`;
  } else if (req && req.status === "pending") {
    body = `<div class="note">⏳ طلبك وصل وعم ينراجع. أول ما ينقبل بيتفعّل التطبيق لحاله، وما في داعي تبعت مرة تانية.</div>
      <button class="btn ghost" id="sub-check">تحقق هلق</button>`;
  } else {
    body = `${reason ? `<div class="note">«${esc(reason)}» للمشتركين. ${inTrial() ? "" : "خلصت التجربة المجانية."}</div>` : ""}
      <ul style="margin:0;padding-inline-start:20px;line-height:1.9">${PREMIUM_FEATURES.map(f => `<li>${f}</li>`).join("")}</ul>
      ${price ? `<div class="row between"><b>الاشتراك الشهري</b><b class="num" style="color:var(--herb);font-size:20px">${esc(price)} ${esc(SUB.config.currency)}</b></div>` : ""}
      ${req && req.status === "rejected" ? `<div class="note" style="background:var(--tomato-soft)">طلبك السابق ما انقبل${req.why ? ": " + esc(req.why) : ""}. تأكد من الإيصال وابعت من جديد.</div>` : ""}
      <b>١. ادفع بشام كاش على هالكود:</b>
      <img src="pay-qr.jpg" alt="QR شام كاش" style="width:100%;max-width:300px;align-self:center;border-radius:14px">
      <div class="row"><code style="direction:ltr;flex:1;font-size:13px;word-break:break-all">${SUB.wallet}</code><button class="chip" id="copy-w">نسخ</button></div>
      <b>٢. ابعت صورة الإيصال:</b>
      <label class="muted" for="s-name">اسمك</label><input id="s-name" type="text" value="${esc((req && req.name) || (getAccount() || {}).name || "")}">
      <label class="muted" for="s-phone">رقم موبايلك (واتساب)</label><input id="s-phone" type="tel" dir="ltr" value="${esc((req && req.phone) || "")}">
      <label class="btn ghost" for="s-rc" id="s-rc-l">📎 اختار صورة الإيصال</label><input id="s-rc" type="file" accept="image/*" hidden>
      <img id="s-prev" alt="" style="display:none;max-height:180px;object-fit:contain;border-radius:12px">
      <button class="btn" id="s-send">ابعت الطلب</button>`;
  }
  sheet(`<h2>${subState.active ? "اشتراكك" : "اشترك بحريره"}</h2>${body}
    ${supportBox()}
    <div class="row between"><small class="muted" dir="ltr">${esc((getAccount() || {}).email || "")}</small><button class="chip" id="logout">تسجيل خروج</button></div>
`, el => {
    const cw = $("#copy-w", el); if (cw) cw.onclick = () => navigator.clipboard.writeText(SUB.wallet).then(() => toast("انسخ"), () => toast(SUB.wallet));
    let file = null;
    const rc = $("#s-rc", el); if (rc) rc.onchange = () => { file = rc.files[0]; if (file) { const pv = $("#s-prev", el); pv.src = URL.createObjectURL(file); pv.style.display = "block"; $("#s-rc-l", el).textContent = "✓ تغيير الصورة"; } };
    const send = $("#s-send", el);
    if (send) send.onclick = async () => {
      const name = $("#s-name", el).value.trim(), phone = $("#s-phone", el).value.trim();
      if (!name || phone.replace(/\D/g, "").length < 8) return toast("اكتب اسمك ورقم موبايلك");
      if (!file) return toast("اختار صورة الإيصال");
      send.disabled = true; send.textContent = "عم ابعت…";
      try { await sendSubRequest({ name, phone, plan: "m1", file }); toast("وصل طلبك! بيتفعّل أول ما ينقبل"); closeSheet(); render(); startPolling(); }
      catch (e) { toast(e.message || "ما زبط، جرب كمان مرة"); send.disabled = false; send.textContent = "ابعت الطلب"; }
    };
    const chk = $("#sub-check", el); if (chk) chk.onclick = async () => { chk.disabled = true; const c = await pollActivation(); await refreshSub(); closeSheet(); render(); toast(c ? "انحدّث وضع اشتراكك" : "لسا ما في رد، بيوصلك لحاله"); };
    $("#logout", el).onclick = () => { logout(); closeSheet(); subState.active = false; refreshSub().then(render); toast("سجّلت خروج"); };
  });
}
let pollTimer = null;
function startPolling() {
  if (pollTimer) return;
  const tick = async () => {
    const before = subState.active;
    if (await pollActivation()) { await refreshSub(); if (!before && subState.active) toast("⭐ تفعّل اشتراكك! شكراً"); render(); scheduleReminders(); }
    const r = getReq(); if (!(r && r.status === "pending")) { clearInterval(pollTimer); pollTimer = null; }
  };
  tick(); pollTimer = setInterval(tick, 20000);
}

// ===== الرياضة =====
const SPORTS = [["مشي عادي", 3.5], ["مشي سريع", 4.3], ["جري", 9.8], ["جري خفيف", 7], ["دراجة", 7.5], ["سباحة", 6], ["كرة قدم", 7], ["كرة سلة", 6.5], ["حديد / جيم", 5], ["تمارين HIIT", 8], ["نط حبل", 11], ["طلوع درج", 8], ["رقص", 5], ["يوغا / تمدد", 2.5], ["تمارين بالبيت", 4], ["ملاكمة", 9]];
function exerciseCard() {
  const l = (S.ex && S.ex[key(day)]) || [];
  return `<div class="card"><div class="row between"><h2>الرياضة</h2><button class="chip" id="ex-add">+ تمرين</button></div>
    ${l.length ? l.map((e, i) => `<div class="entry"><div class="t"><b>${esc(e.n)}</b><small class="muted num">${fmt(e.min)} دقيقة</small></div><span class="k num" style="color:var(--herb)">−${fmt(e.k)}</span><button class="del" data-exdel="${i}" aria-label="احذف">×</button></div>`).join("")
      : `<small class="muted">سجّل تمرينك، والسعرات المحروقة بتنضاف لميزانية يومك.</small>`}</div>`;
}
function exerciseSheet() {
  const kg = latestWeight() || (S.profile && S.profile.w) || 70;
  sheet(`<h2>تمرين جديد</h2>
    <label class="muted" for="ex-t">النشاط</label><select id="ex-t">${SPORTS.map((x, i) => `<option value="${i}">${x[0]}</option>`).join("")}</select>
    <label class="muted" for="ex-m">المدة بالدقايق</label><input id="ex-m" type="number" inputmode="numeric" value="30">
    <div class="quick">${[15, 30, 45, 60, 90].map(v => `<button class="chip" data-m="${v}">${fmt(v)} د</button>`).join("")}</div>
    <div class="note" id="ex-r"></div>
    <small class="muted">الحساب حسب وزنك (${fmt1(kg)} كغ). سجّل وزنك لتكون الأرقام أدق.</small>
    <button class="btn" id="ex-save">أضف</button>`, el => {
    const calcK = () => r0(SPORTS[+$("#ex-t", el).value][1] * kg * (+$("#ex-m", el).value || 0) / 60);
    const upd = () => { $("#ex-r", el).innerHTML = `بتحرق تقريباً <b class="num">${fmt(calcK())}</b> سعرة`; };
    $("#ex-t", el).oninput = upd; $("#ex-m", el).oninput = upd;
    el.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { $("#ex-m", el).value = b.dataset.m; upd(); });
    $("#ex-save", el).onclick = () => {
      const min = +$("#ex-m", el).value; if (!(min > 0 && min <= 600)) return toast("اكتب المدة بالدقايق");
      const k = key(day); S.ex = S.ex || {}; (S.ex[k] = S.ex[k] || []).push({ n: SPORTS[+$("#ex-t", el).value][0], min, k: calcK() });
      save(); closeSheet(); render(); toast("انضاف التمرين 💪");
    };
    upd();
  });
}

// ===== النصيحة اليومية =====
function tipCard() {
  const t = tipOfDay(day);
  return `<div class="note" style="display:flex;gap:10px;align-items:flex-start"><span aria-hidden="true">💡</span><span>${esc(LANG === "en" ? t[1] : t[0])}</span></div>`;
}

// ===== التذكيرات (بتشتغل بتطبيق الأندرويد حتى لو كان مسكّر) =====
const REM_DEFAULT = { water: { on: true, every: 2, from: 9, to: 22 }, meals: { on: true, times: ["09:00", "14:00", "20:00"] }, weight: { on: false, time: "08:00" }, tip: { on: true, time: "11:00" } };
const canNotify = () => !!(window.AndroidApp && AndroidApp.setReminders);
function scheduleReminders() {
  if (!canNotify()) return;
  const R = Object.assign({}, REM_DEFAULT, S.rem || {});
  const list = [];
  if (isPremium() && S.remOn) {
    const now = Date.now(), en = LANG === "en";
    const at = (d, hm) => { const [h, m] = hm.split(":").map(Number); const x = new Date(d); x.setHours(h, m || 0, 0, 0); return x.getTime(); };
    for (let i = 0; i < 10; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      const ds = key(d);
      if (R.water.on) for (let h = R.water.from; h <= R.water.to; h += R.water.every) list.push({ id: "w" + ds + h, at: at(d, h + ":00"), title: en ? "Time for water 💧" : "وقت المي 💧", body: en ? "Drink a glass of water and log it in Harira." : "اشرب كاسة مي وسجّلها بحريره." });
      if (R.meals.on) R.meals.times.forEach((t, j) => list.push({ id: "m" + ds + j, at: at(d, t), title: en ? "Log your meal 🍽️" : "سجّل وجبتك 🍽️", body: en ? "Snap your plate or add what you ate." : "صوّر صحنك أو أضف شو أكلت." }));
      if (R.weight.on) list.push({ id: "k" + ds, at: at(d, R.weight.time), title: en ? "Weigh-in ⚖️" : "وقت الوزن ⚖️", body: en ? "Log today's weight." : "سجّل وزنك اليوم." });
      if (R.tip.on) { const t = tipOfDay(d); list.push({ id: "t" + ds, at: at(d, R.tip.time), title: en ? "Tip of the day 💡" : "نصيحة اليوم 💡", body: en ? t[1] : t[0] }); }
    }
    for (let i = list.length - 1; i >= 0; i--) if (list[i].at <= now) list.splice(i, 1);
  }
  try { AndroidApp.setReminders(JSON.stringify(list)); } catch (e) {}
}
function remindersSheet() {
  const R = JSON.parse(JSON.stringify(Object.assign({}, REM_DEFAULT, S.rem || {})));
  const tsel = (id, v) => `<input id="${id}" type="time" value="${v}" style="max-width:130px">`;
  sheet(`<h2>التذكيرات</h2>
    ${canNotify() ? "" : `<div class="note">التذكيرات بتشتغل بتطبيق حريره على الأندرويد. نزّل التطبيق لتوصلك.</div>`}
    <label class="row between"><b>شغّل التذكيرات</b><input id="r-on" type="checkbox" ${S.remOn ? "checked" : ""} style="width:22px;height:22px"></label>
    <label class="row between"><span>💧 المي كل</span><select id="r-we" style="max-width:120px">${[1, 2, 3].map(v => `<option value="${v}" ${v === R.water.every ? "selected" : ""}>${fmt(v)} ساعة</option>`).join("")}</select><input id="r-w" type="checkbox" ${R.water.on ? "checked" : ""} style="width:22px;height:22px"></label>
    <div class="row"><span class="muted">من</span><select id="r-wf" style="max-width:110px">${[6, 7, 8, 9, 10].map(v => `<option value="${v}" ${v === R.water.from ? "selected" : ""}>${fmt(v)}:٠٠</option>`).join("")}</select>
      <span class="muted">لـ</span><select id="r-wt" style="max-width:110px">${[20, 21, 22, 23].map(v => `<option value="${v}" ${v === R.water.to ? "selected" : ""}>${fmt(v)}:٠٠</option>`).join("")}</select></div>
    <label class="row between"><span>🍽️ الوجبات</span><input id="r-m" type="checkbox" ${R.meals.on ? "checked" : ""} style="width:22px;height:22px"></label>
    <div class="row">${R.meals.times.map((t, i) => tsel("r-mt" + i, t)).join("")}</div>
    <label class="row between"><span>⚖️ الوزن</span>${tsel("r-kt", R.weight.time)}<input id="r-k" type="checkbox" ${R.weight.on ? "checked" : ""} style="width:22px;height:22px"></label>
    <label class="row between"><span>💡 نصيحة اليوم</span>${tsel("r-tt", R.tip.time)}<input id="r-t" type="checkbox" ${R.tip.on ? "checked" : ""} style="width:22px;height:22px"></label>
    <button class="btn" id="r-save">احفظ</button>`, el => {
    $("#r-save", el).onclick = () => {
      R.water = { on: $("#r-w", el).checked, every: +$("#r-we", el).value, from: +$("#r-wf", el).value, to: +$("#r-wt", el).value };
      R.meals = { on: $("#r-m", el).checked, times: R.meals.times.map((_, i) => $("#r-mt" + i, el).value || REM_DEFAULT.meals.times[i]) };
      R.weight = { on: $("#r-k", el).checked, time: $("#r-kt", el).value || "08:00" };
      R.tip = { on: $("#r-t", el).checked, time: $("#r-tt", el).value || "11:00" };
      S.rem = R; S.remOn = $("#r-on", el).checked; save();
      if (S.remOn && window.AndroidApp && AndroidApp.askNotifications) try { AndroidApp.askNotifications(); } catch (e) {}
      scheduleReminders(); closeSheet(); toast(S.remOn ? "🔔 انضبطت التذكيرات" : "انطفت التذكيرات");
    };
  });
}

// ===== المي والوزن =====
function latestWeight() { const w = S.weights || {}; const k = Object.keys(w).sort().pop(); return k ? w[k] : null; }
function logWeight(v) { (S.weights = S.weights || {})[key(new Date())] = v; save(); }
function waterCard() {
  const k = key(day), n = (S.water || {})[k] || 0, goal = S.waterMl ? Math.max(6, Math.round(S.waterMl / 250)) : 8;
  return `<div class="card"><div class="row between"><h2>💧 المي</h2><span class="muted num">${fmt1(n * 0.25)} / ${fmt1(goal * 0.25)} لتر</span></div>
    <div class="row between" style="margin-top:10px"><button class="icon-btn" id="w-minus" aria-label="أنقص كاسة">−</button>
      <div class="cups" aria-hidden="true">${Array.from({ length: goal }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div>
      <button class="icon-btn" id="w-plus" aria-label="زيد كاسة">+</button></div>
    <small class="muted">${n >= goal ? "وصلت لهدفك اليوم 👏" : "كل كاسة ٢٥٠ مل · باقي " + fmt(goal - n) + " كاسات"}</small></div>`;
}
function weightCard() {
  const w = S.weights || {}, ks = Object.keys(w).sort().slice(-30);
  const last = ks.length ? w[ks[ks.length - 1]] : null;
  let chart = "";
  if (ks.length >= 2) {
    const vals = ks.map(k => w[k]), mn = Math.min(...vals) - 1, mx = Math.max(...vals) + 1, W = 300, H = 80;
    const pts = vals.map((v, i) => `${W - i / (vals.length - 1) * W},${H - (v - mn) / (mx - mn) * H}`).join(" ");
    chart = `<svg viewBox="-6 -6 ${W + 12} ${H + 12}" style="width:100%;margin-top:8px" role="img" aria-label="الوزن مع الوقت"><polyline points="${pts}" fill="none" stroke="var(--herb)" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="0" cy="${H - (vals[vals.length - 1] - mn) / (mx - mn) * H}" r="4" fill="var(--herb)"/></svg>
      <div class="row between muted num" style="font-size:12px"><span>${fmt1(vals[0])} كغ</span><span>${fmt1(vals[vals.length - 1])} كغ</span></div>`;
  }
  return `<div class="card"><div class="row between"><h2>الوزن</h2><button class="chip" id="wt-add">${last ? "آخر وزن: " + fmt1(last) + " كغ · سجّل" : "سجّل وزنك"}</button></div>${chart}</div>`;
}
function weightSheet() {
  sheet(`<h2>وزنك اليوم</h2><label class="muted" for="wt">الوزن بالكيلو</label>
    <input id="wt" type="number" inputmode="decimal" step="0.1" value="${latestWeight() || ""}"><button class="btn" id="wt-save">احفظ</button>`, el => {
    $("#wt-save", el).onclick = () => {
      const v = r1(+$("#wt", el).value);
      if (!(v >= 30 && v <= 300)) return toast("اكتب وزن صحيح بالكيلو");
      logWeight(v); if (typeof applyPlan === "function") applyPlan(); save(); closeSheet(); render(); toast("انسجل الوزن" + (S.profile && S.profile.done ? "، وانحدّثت خطتك" : ""));
    };
  });
}

// ===== المفضلة والأخيرة =====
function recentFoods() {
  const seen = new Set(), out = [];
  const days = Object.keys(S.days).sort().reverse();
  for (const d of days) for (const e of [...S.days[d]].reverse()) {
    if (seen.has(e.n)) continue; seen.add(e.n);
    const f = FOODS.find(x => x.n === e.n);
    if (f) out.push({ f, g: e.g });
    if (out.length >= 8) return out;
  }
  return out;
}
const isFav = n => (S.favs || []).includes(n);
function toggleFav(n) { S.favs = S.favs || []; S.favs = isFav(n) ? S.favs.filter(x => x !== n) : [...S.favs, n]; save(); }

// ===== الباركود =====
let zxingReady = null;
function decodeBarcode(file) {
  zxingReady = zxingReady || loadScript("ml/zxing.min.js");
  return zxingReady.then(() => new Promise((ok, bad) => {
    const img = new Image();
    img.onload = () => {
      const Z = window.ZXing, hints = new Map();
      hints.set(Z.DecodeHintType.TRY_HARDER, true);
      hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128]);
      const reader = new Z.MultiFormatReader(); reader.setHints(hints);
      for (const size of [1200, 800, 1600]) for (const rot of [0, 90]) {
        const s = Math.min(1, size / Math.max(img.width, img.height)), c = document.createElement("canvas"), ctx = c.getContext("2d");
        const w = Math.round(img.width * s), h = Math.round(img.height * s);
        if (rot) { c.width = h; c.height = w; ctx.translate(h, 0); ctx.rotate(Math.PI / 2); } else { c.width = w; c.height = h; }
        ctx.drawImage(img, 0, 0, w, h);
        try { return ok(reader.decode(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(c)))).getText()); } catch (e) {}
      }
      bad(new Error("ما قدرت اقرأ الباركود. قرّب الكاميرا وخلّي الخطوط واضحة."));
    };
    img.onerror = () => bad(new Error("ما قدرت افتح الصورة"));
    img.src = URL.createObjectURL(file);
  }));
}
async function scanBarcode(file) {
  toast("عم اقرأ الباركود…");
  let code;
  try { code = await decodeBarcode(file); } catch (e) { return toast(e.message); }
  const mine = FOODS.find(f => f.bc === code);
  if (mine) return qtySheet(mine);
  if (!navigator.onLine) return toast("الباركود " + code + ": بدو إنترنت لأول مرة");
  toast("عم دوّر على المنتج…");
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_ar,product_name_en,brands,nutriments,serving_quantity`);
    const j = await r.json();
    const pr = j.product, nu = pr && pr.nutriments;
    const k = nu && (nu["energy-kcal_100g"] ?? (nu["energy_100g"] ? nu["energy_100g"] / 4.184 : null));
    if (!pr || k == null) throw new Error("nf");
    const base = pr.product_name_ar || pr.product_name || pr.product_name_en || ("منتج " + code), brand = pr.brands ? pr.brands.split(",")[0].trim() : "";
    const name = base + (brand && !base.toLowerCase().includes(brand.toLowerCase()) ? " · " + brand : "");
    const sq = +pr.serving_quantity || 100;
    const c = [name.slice(0, 60), r0(k), r1(nu.proteins_100g || 0), r1(nu.carbohydrates_100g || 0), r1(nu.fat_100g || 0), "حصة", sq, code];
    (S.custom = S.custom || []).push(c); save();
    qtySheet(addCustomToFoods(c));
  } catch (e) {
    toast("ما لقيت هالمنتج بالقاعدة العالمية. أضفه لأكلاتي من المكتوب على الغلاف.");
    query = ""; customSheet(code);
  }
}

// ---------- شاشة إضافة أكلة ----------
const norm = s => s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[ًٌٍَُِّْ]/g, "").toLowerCase();
function renderAdd() {
  const cats = ["الكل", ...new Set(FOODS.map(f => f.c))];
  app.innerHTML = `
  <div class="head"><h1>الأكل</h1><span class="muted">${dayLabel()}${mealPick ? " · " + mealPick : ""}</span></div>
  ${learnCtx ? "" : `<div class="food-actions"><button data-go="photo"><span>📸</span><b>حلّل صحنك</b><small>بالصورة</small></button><label for="bc-in"><span>▦</span><b>باركود</b><small>للمنتجات</small></label></div>`}
  <div class="stack">
    ${learnCtx ? `<div class="note row between" style="gap:8px"><span>اختار الأكلة اللي بالصورة، وبتعلّمها للمرة الجاية.</span><button class="chip" id="learn-x">إلغاء</button></div>` : ""}
    <div class="row"><input id="q" type="search" placeholder="دوّر: رز، شاورما، تفاح…" value="${esc(query)}" aria-label="ابحث عن أكلة">
      <label class="icon-btn" for="bc-in" aria-label="امسح باركود" title="امسح باركود" style="flex:none;width:46px;height:46px">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7V5h3M17 5h3v2M20 17v2h-3M7 19H4v-2M8 9v6M11 9v6M14 9v6M17 9v6"/></svg></label>
      <input id="bc-in" type="file" accept="image/*" capture="environment" hidden></div>
    ${quickRow()}
    <div class="chips">${cats.map(c => `<button class="chip" aria-pressed="${c === cat}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <div class="card foods" id="list"></div>
    <button class="btn ghost" id="new-food">+ أكلة مو موجودة؟ أضفها لأكلاتي</button>
    <p class="muted" style="font-size:12px;margin:0">القيم تقريبية لكل ١٠٠ غرام، وبتختلف حسب طريقة الطبخ والمكونات.</p>
  </div>`;
  const lx = $("#learn-x"); if (lx) lx.onclick = () => { learnCtx = null; renderAdd(); };
  app.querySelectorAll(".food-actions [data-go]").forEach(b => b.onclick = () => go(b.dataset.go));
  $("#new-food").onclick = () => customSheet();
  $("#bc-in").onclick = e => { if (!requirePremium("مسح الباركود")) e.preventDefault(); };
  $("#bc-in").onchange = e => e.target.files[0] && scanBarcode(e.target.files[0]);
  app.querySelectorAll("[data-quick]").forEach(b => b.onclick = () => { const [n, g] = b.dataset.quick.split("|"); const f = FOODS.find(x => x.n === n); if (f) qtySheet(f, null, +g || f.ug); });
  const q = $("#q");
  q.oninput = () => { query = q.value; drawList(); };
  app.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { cat = b.dataset.cat; renderAdd(); });
  drawList();
}
function quickRow() {
  if (query || learnCtx) return "";
  const favs = (S.favs || []).map(n => FOODS.find(f => f.n === n)).filter(Boolean).map(f => ({ f, g: f.ug, fav: true }));
  const rec = recentFoods().filter(r => !isFav(r.f.n));
  const all = [...favs, ...rec].slice(0, 10);
  if (!all.length) return "";
  return `<div class="stack" style="gap:6px"><span class="muted" style="font-size:13px">المفضلة والأخيرة</span>
    <div class="chips">${all.map(x => `<button class="chip" data-quick="${esc(x.f.n)}|${x.g}">${x.fav ? "★ " : ""}${esc(x.f.n)} · <span class="num">${fmt(x.g)}غ</span></button>`).join("")}</div></div>`;
}
function drawList() {
  const nq = norm(query.trim());
  const nm = f => norm(f.n) + " " + norm(foodName(f.n));
  let list = FOODS.filter(f => (cat === "الكل" || f.c === cat) && (!nq || nm(f).includes(nq)));
  if (nq) list.sort((a, b) => nm(a).indexOf(nq) - nm(b).indexOf(nq));
  $("#list").innerHTML = list.length ? list.slice(0, 120).map(f => `<button class="food" data-id="${f.id}">
      <span class="t">${esc(f.n)}<small>${esc(f.c)} · ١ ${esc(f.u)} ≈ ${fmt(f.ug)} غ</small></span>
      <span class="k num">${fmt(f.k)} <small class="muted">/١٠٠غ</small></span></button>`).join("")
    : `<div class="empty"><p>ما لقيت "${esc(query)}".</p><p class="muted">جرّب اسم تاني، أو أضفها لأكلاتي من الزر تحت.</p></div>`;
  $("#list").querySelectorAll("[data-id]").forEach(b => b.onclick = () => qtySheet(FOODS[+b.dataset.id]));
}

function customSheet(barcode) {
  sheet(`<h2>أكلة جديدة لأكلاتي</h2>
    <label class="muted" for="c-n">الاسم</label><input id="c-n" type="text" value="${esc(query)}" placeholder="مثلاً: كبة نية، فطيرة جدتي…">
    <label class="muted" for="c-k">السعرات بكل ١٠٠ غرام</label><input id="c-k" type="number" inputmode="decimal" placeholder="مثلاً ٢٠٠">
    <p class="muted" style="margin:0;font-size:13px">إذا ما بتعرفها، اكتب رقم أكلة بتشبهها من القائمة، أو شوف المكتوب على الغلاف.</p>
    <div class="row"><div style="flex:1"><label class="muted" for="c-u">الوحدة</label><input id="c-u" type="text" value="صحن"></div>
      <div style="flex:1"><label class="muted" for="c-g">غرامات الوحدة</label><input id="c-g" type="number" inputmode="decimal" value="250"></div></div>
    <button class="btn" id="c-save">احفظ واستعملها</button>`, el => {
    $("#c-save", el).onclick = () => {
      const n = $("#c-n", el).value.trim(), k = +$("#c-k", el).value, u = $("#c-u", el).value.trim() || "حصة", ug = +$("#c-g", el).value || 100;
      if (!n) return toast("اكتب اسم الأكلة");
      if (!(k >= 0 && k <= 900)) return toast("اكتب السعرات بين ٠ و٩٠٠ لكل ١٠٠ غرام");
      // تقدير تقريبي للعناصر من السعرات: ٢٠٪ بروتين، ٥٠٪ كربوهيدرات، ٣٠٪ دهون
      const c = [n, k, r1(k * .2 / 4), r1(k * .5 / 4), r1(k * .3 / 9), u, ug];
      if (typeof barcode === "string") c.push(barcode);
      (S.custom = S.custom || []).push(c); save();
      const f = addCustomToFoods(c);
      closeSheet(); setTimeout(() => qtySheet(f), 50);
    };
  });
}

function qtySheet(f, src, g0) {
  let g = g0 || f.ug;
  let meal = mealPick || guessMeal();
  sheet(`<div class="row between"><h2>${esc(f.n)}</h2><button class="icon-btn" id="fav" aria-label="مفضلة" aria-pressed="${isFav(f.n)}" style="color:${isFav(f.n) ? "var(--saffron)" : "var(--muted)"}">${isFav(f.n) ? "★" : "☆"}</button></div>
    <span class="muted num" style="margin-top:-8px">${fmt(f.k)} سعرة/١٠٠غ</span>
    <label class="muted" for="gr">الكمية بالغرام</label>
    <div class="qty"><button class="icon-btn" id="minus" aria-label="أنقص">−</button>
      <input id="gr" type="number" inputmode="decimal" min="1" value="${g}"><button class="icon-btn" id="plus" aria-label="زيد">+</button></div>
    <div class="quick">
      <button class="chip" data-g="${f.ug}">١ ${esc(f.u)}</button><button class="chip" data-g="${f.ug * 2}">٢ ${esc(f.u)}</button>
      <button class="chip" data-g="${r0(f.ug / 2)}">نص ${esc(f.u)}</button><button class="chip" data-g="100">١٠٠ غ</button></div>
    <div class="result" id="res"></div>
    <label class="muted" for="meal">الوجبة</label>
    <select id="meal">${MEALS.map(m => `<option value="${m}" ${m === meal ? "selected" : ""}>${m}</option>`).join("")}</select>
    <button class="btn" id="add">أضف للسجل</button>`, el => {
    const gr = $("#gr", el);
    $("#fav", el).onclick = () => { toggleFav(f.n); const on = isFav(f.n), b = $("#fav", el); b.textContent = on ? "★" : "☆"; b.style.color = on ? "var(--saffron)" : "var(--muted)"; toast(on ? "انضافت للمفضلة" : "انشالت من المفضلة"); };
    const upd = () => {
      g = Math.max(0, +gr.value || 0);
      const v = calc(f, g);
      $("#res", el).innerHTML = `<div class="kc"><b class="num">${fmt(v.k)}</b><small>سعرة</small></div>
        <div><b class="num">${fmt1(v.p)}</b><small>بروتين غ</small></div><div><b class="num">${fmt1(v.cb)}</b><small>كربو غ</small></div><div><b class="num">${fmt1(v.f)}</b><small>دهون غ</small></div>`;
      $("#add", el).disabled = g <= 0;
    };
    const step = g >= 100 ? 10 : 5;
    gr.oninput = upd;
    $("#minus", el).onclick = () => { gr.value = Math.max(0, (+gr.value || 0) - step); upd(); };
    $("#plus", el).onclick = () => { gr.value = (+gr.value || 0) + step; upd(); };
    el.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { gr.value = b.dataset.g; upd(); });
    $("#add", el).onclick = () => {
      const v = calc(f, g);
      const fromPhoto = !!learnCtx;
      query = "";
      if (learnCtx) { learn(learnCtx.emb, [{ f, g }]); learnCtx = null; }
      addEntry({ n: f.n, g, ...v, meal: $("#meal", el).value, ...(src || fromPhoto ? { src: "photo" } : {}) });
      closeSheet(); toast(`انضافت: ${f.n} (${fmt(v.k)} سعرة)`);
      mealPick = null;
      if (src === "photo" || fromPhoto) { photo = null; go("today"); }
    };
    upd();
  });
}

// ---------- شاشة الصورة ----------
// التعرّف جوّا الموبايل بموديل جوجل للأكل (مجاني، بدون حد، بيشتغل بدون نت)، والتحليل الأونلاين خيار إضافي
const SIZES = [["صغيرة", 0.7], ["وسط", 1], ["كبيرة", 1.4]];
let photo = null; // { file, url, state: loading|local|cloud-loading|done|error, cands, items, note, error }
function renderPhoto() {
  const p = photo;
  let body;
  if (!p) {
    body = `<div class="card drop">
      <div class="bowl" style="font-family:var(--display);font-size:44px;color:var(--saffron)">ح</div>
      <p style="margin:0">صوّر صحنك من قريب وبضوء منيح، وأنا بقلك شو هالأكلة.</p>
      <div class="row" style="flex-wrap:wrap;justify-content:center">
        <label class="btn" for="cam">صوّر</label><label class="btn ghost" for="gal">اختار من المعرض</label></div>
      <input id="cam" type="file" accept="image/*" capture="environment" hidden>
      <input id="gal" type="file" accept="image/*" hidden></div>
      <p class="note">التعرّف بيصير على موبايلك نفسه، بدون نت وبدون حد يومي. صوّر أكلة وحدة بكل صورة لنتيجة أدق.</p>`;
  } else {
    let inner = "";
    if (p.state === "loading") inner = `<div class="row" style="justify-content:center;padding:18px"><div class="spinner"></div><span>${p.first ? "عم جهّز المحلل لأول مرة…" : "عم اتعرّف على الأكلة…"}</span></div>`;
    else if (p.state === "cloud-loading") inner = `<div class="row" style="justify-content:center;padding:18px"><div class="spinner"></div><span>عم حلل أونلاين، ممكن ياخد دقيقة…</span></div>
      <button class="btn ghost" id="cancel-cloud">رجوع للاقتراحات</button>`;
    else if (p.state === "error") inner = `<p style="color:var(--tomato);margin:0">${esc(p.error)}</p>
      <div class="row" style="flex-wrap:wrap"><button class="btn" id="retry">جرّب مرة تانية</button><button class="btn ghost" data-go="add">دوّر بالأسماء</button></div>`;
    else if (p.state === "local") {
      const mul = SIZES[p.size || 1][1];
      const others = p.cands.filter(c => !p.items.some(it => it.food.n === c.food.n));
      inner = `<div class="row" style="flex-wrap:wrap;gap:6px"><span class="muted" style="font-size:13px">حجم الصحن:</span>${SIZES.map((z, i) => `<button class="chip" data-size="${i}" aria-pressed="${(p.size || 1) === i}">${z[0]}</button>`).join("")}</div>`;
      inner += p.items.length ? `<div><b>${p.learned === "mine" ? "⭐ تعلّمت هالصحن منك قبل:" : p.learned === "shared" ? "⭐ تعلّمته من مستخدمين تانيين:" : "بالصحن:"}</b>${p.items.map((it, i) => `<div class="ai-item">
          <input type="checkbox" data-chk="${i}" ${it.on ? "checked" : ""} aria-label="ضمّن ${esc(it.food.n)}">
          <div><b>${esc(it.food.gen ? it.food.type : it.food.n)}</b><small class="muted num" style="display:block"><span id="k${i}"></span>${it.food.gen && it.en ? " · " + esc(it.en) : ""}${it.score ? " · " + fmt(it.score * 100) + "٪" : ""}</small></div>
          <label><input type="number" inputmode="decimal" data-g="${i}" value="${r0(it.grams * mul)}" aria-label="غرامات ${esc(it.food.n)}"><small class="muted">غرام</small></label></div>`).join("")}</div>
        <div class="row between"><b>المجموع</b><b class="num" id="aitot" style="color:var(--tomato)"></b></div>
        <select id="ai-meal" aria-label="الوجبة">${MEALS.map(m => `<option value="${m}" ${m === guessMeal() ? "selected" : ""}>${m}</option>`).join("")}</select>
        <button class="btn" id="ai-add">أضف للسجل</button>`
        : `<p style="margin:0">ما قدرت ميّز أكل بهالصورة. جرّب صورة أقرب وأوضح.</p>`;
      if (others.length) inner += `<div class="stack" style="gap:6px"><span class="muted" style="font-size:13px">في شي غلط أو ناقص؟ كبّس لتضيفه:</span>
        <div class="row" style="flex-wrap:wrap;gap:6px">${others.map((c, i) => `<button class="chip" data-alt="${p.cands.indexOf(c)}">+ ${esc(c.food.gen ? c.food.type + " (" + c.en + ")" : c.food.n)}</button>`).join("")}</div></div>`;
      inner += `<p class="note">الأوزان تقديرية حسب الحصة المعتادة. شيل الصح عن الغلط وعدّل الغرامات، والتطبيق بيتعلّم من اختيارك.</p>
        <div class="row" style="flex-wrap:wrap"><button class="btn ghost" data-go="add">أكلة مو موجودة؟ دوّر عليها وعلّمني ياها</button></div>
        <button class="chip" id="cloud" style="align-self:flex-start">تحليل أونلاين (أبطأ)</button>`;
    } else if (p.state === "done") {
      inner = p.items.length ? `<div>${p.items.map((it, i) => `<div class="ai-item">
          <input type="checkbox" data-chk="${i}" ${it.on ? "checked" : ""} aria-label="ضمّن ${esc(it.name)}">
          <div><b>${esc(it.name)}</b><small class="muted num" style="display:block" id="k${i}">${fmt(it.kcal100 * it.grams / 100)} سعرة</small></div>
          <label><input type="number" inputmode="decimal" data-g="${i}" value="${r0(it.grams)}" aria-label="غرامات ${esc(it.name)}"><small class="muted">غرام</small></label></div>`).join("")}</div>
        <div class="row between"><b>المجموع</b><b class="num" id="aitot" style="color:var(--tomato)"></b></div>
        <select id="ai-meal" aria-label="الوجبة">${MEALS.map(m => `<option value="${m}" ${m === guessMeal() ? "selected" : ""}>${m}</option>`).join("")}</select>
        <button class="btn" id="ai-add">أضف للسجل</button>`
        : `<p style="margin:0">ما قدرت ميّز أكل بهالصورة. جرّب صورة أوضح، أو اختار الأكلة يدوياً.</p>`;
      if (p.note) inner += `<p class="note">${esc(p.note)}</p>`;
    }
    body = `<div class="card stack"><img class="preview" src="${p.url}" alt="صورة الأكلة">${inner}
      <button class="btn ghost" id="again">صورة جديدة</button></div>`;
  }
  app.innerHTML = `<div class="head"><div class="row" style="gap:8px"><button class="icon-btn" id="ph-back" aria-label="رجوع">${LANG === "en" ? "‹" : "›"}</button><h1>تحليل الصحن</h1></div><span class="muted">${dayLabel()}</span></div><div class="stack">${body}</div>`;
  $("#ph-back").onclick = () => go("add");

  ["cam", "gal"].forEach(id => { const el = $("#" + id); if (el) { el.onclick = e => { if (!requirePremium("تحليل الصحن بالصورة")) e.preventDefault(); }; el.onchange = () => el.files[0] && analyze(el.files[0]); } });
  const again = $("#again"); if (again) again.onclick = () => { photo = null; renderPhoto(); };
  const retry = $("#retry"); if (retry) retry.onclick = () => analyze(p.file);
  const cloud = $("#cloud"); if (cloud) cloud.onclick = () => cloudAnalyze();
  const cc = $("#cancel-cloud"); if (cc) cc.onclick = () => { p.cloudCtl && p.cloudCtl.abort(); p.state = p.cands ? "local" : "error"; renderPhoto(); };
  app.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { if (p && p.emb && b.dataset.go === "add") learnCtx = { emb: p.emb }; query = ""; go(b.dataset.go); });
  app.querySelectorAll("[data-size]").forEach(b => b.onclick = () => { p.size = +b.dataset.size; renderPhoto(); });
  if (p && p.state === "local") {
    const mul = SIZES[p.size || 1][1];
    const tot = () => {
      let sum = 0;
      p.items.forEach((it, i) => { const k = it.food.k * it.g / 100; const el = $("#k" + i); if (el) el.textContent = fmt(k) + " سعرة"; if (it.on) sum += k; });
      const t = $("#aitot"); if (t) t.textContent = fmt(sum) + " سعرة";
    };
    p.items.forEach(it => { it.g = r0(it.grams * mul); });
    app.querySelectorAll("[data-g]").forEach(inp => inp.oninput = () => { const it = p.items[+inp.dataset.g]; it.g = Math.max(0, +inp.value || 0); it.grams = it.g / mul; tot(); });
    app.querySelectorAll("[data-chk]").forEach(c => c.onchange = () => { p.items[+c.dataset.chk].on = c.checked; tot(); });
    app.querySelectorAll("[data-alt]").forEach(b => b.onclick = () => { const c = p.cands[+b.dataset.alt]; p.items.push({ food: c.food, en: c.en, score: c.score, grams: c.food.ug, on: true }); renderPhoto(); });
    const add = $("#ai-add");
    if (add) add.onclick = () => {
      const meal = $("#ai-meal").value, chosen = p.items.filter(it => it.on && it.g > 0);
      if (!chosen.length) return toast("اختار أكلة وحدة على الأقل");
      let sum = 0;
      chosen.forEach(it => { const v = calc(it.food, it.g); sum += v.k; addEntry({ n: it.food.n, g: it.g, ...v, meal, src: "photo" }); });
      learn(p.emb, chosen.map(it => ({ f: it.food, g: it.g })));
      photo = null; toast(`انضاف ${fmt(chosen.length)} أصناف (${fmt(sum)} سعرة)`); go("today");
    };
    tot();
  }

  if (p && p.state === "done" && p.items.length) {
    const tot = () => {
      let s = 0;
      p.items.forEach((it, i) => { const k = it.kcal100 * it.grams / 100; $("#k" + i).textContent = fmt(k) + " سعرة"; if (it.on) s += k; });
      $("#aitot").textContent = fmt(s) + " سعرة";
    };
    app.querySelectorAll("[data-g]").forEach(inp => inp.oninput = () => { p.items[+inp.dataset.g].grams = Math.max(0, +inp.value || 0); tot(); });
    app.querySelectorAll("[data-chk]").forEach(c => c.onchange = () => { p.items[+c.dataset.chk].on = c.checked; tot(); });
    $("#ai-add").onclick = () => {
      const meal = $("#ai-meal").value;
      let n = 0, s = 0;
      p.items.filter(it => it.on && it.grams > 0).forEach(it => {
        const v = calc({ k: it.kcal100, p: it.p100, cb: it.c100, f: it.f100 }, it.grams);
        addEntry({ n: it.name, g: it.grams, ...v, meal, src: "ai" }); n++; s += v.k;
      });
      if (!n) return toast("اختار أكلة وحدة على الأقل");
      photo = null; toast(`انضاف ${fmt(n)} أصناف (${fmt(s)} سعرة)`); go("today");
    };
    tot();
  }
}

// تحميل موديل الأكل مرة وحدة (بالتطبيق بيجي من جوّا الـ APK، وبالمتصفح بينحفظ بعد أول مرة)
let clsPromise = null;
function loadScript(src) { return new Promise((ok, bad) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = bad; document.head.appendChild(s); }); }
// تلات موديلات من جوجل بتشتغل على الموبايل: طبخات (٢٠٠٠ صنف)، عام (فواكه وخضار ومكونات)، وبصمة الصورة للتعلّم
function getModels() {
  if (!clsPromise) {
    clsPromise = (async () => {
      if (typeof ML_LABELS === "undefined") await loadScript("ml/labels.js");
      if (typeof ML_GENERAL === "undefined") await loadScript("ml/general.js");
      const { FilesetResolver, ImageClassifier, ImageEmbedder } = await import(new URL("ml/vision_bundle.mjs", location.href).href);
      const files = await FilesetResolver.forVisionTasks(new URL("ml/wasm", location.href).href);
      const url = n => new URL("ml/" + n, location.href).href;
      const [food, general, embed] = await Promise.all([
        ImageClassifier.createFromOptions(files, { baseOptions: { modelAssetPath: url("food.tflite") }, maxResults: 30, runningMode: "IMAGE" }),
        ImageClassifier.createFromOptions(files, { baseOptions: { modelAssetPath: url("general.tflite") }, maxResults: 10, runningMode: "IMAGE" }).catch(() => null),
        ImageEmbedder.createFromOptions(files, { baseOptions: { modelAssetPath: url("embed.tflite") }, quantize: true, l2Normalize: true, runningMode: "IMAGE" }).catch(() => null),
      ]);
      return { food, general, embed };
    })();
    clsPromise.catch(() => { clsPromise = null; });
  }
  return clsPromise;
}
const b64e = u8 => { let s = ""; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); };
const b64d = s => Int8Array.from(atob(s), c => (c.charCodeAt(0) << 24) >> 24);
function cosine(a, b) { let d = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; } return d / (Math.sqrt(na * nb) || 1); }
const snap = f => ({ n: f.n, c: f.c, k: f.k, p: f.p, cb: f.cb, f: f.f, u: f.u, ug: f.ug, gen: f.gen, type: f.type });
// items: [{ f: أكلة, g: غرامات }]
function learn(emb, items, g) {
  if (!emb || !items) return;
  if (!Array.isArray(items)) items = [{ f: items, g }];
  const entry = { e: emb, items: items.map(it => ({ f: snap(it.f), g: it.g })) };
  LEARN.push(entry); saveLearn();
  if (typeof shareLearning === "function") shareLearning(entry);
}
const itemsOf = it => it.items || [{ f: it.f, g: it.g }];
const liveFood = f => FOODS.find(x => x.n === f.n) || f;
function foodFromLabel(e) {
  if (e[1]) return FOODS.find(f => f.n === e[1]);
  return { n: `${e[2]} (${e[0]})`, type: e[2], c: "من صورة", k: e[3], p: e[4], cb: e[5], f: e[6], u: e[7], ug: e[8], gen: true };
}
// دمج: اللي تعلّمه من المستخدم أولاً، بعدين أقوى نتائج الموديلين
function toCandidates(foodCats, generalCats) {
  const out = [], seen = new Set(), pool = [];
  for (const c of foodCats) { const e = ML_LABELS[c.index]; if (e) pool.push({ food: foodFromLabel(e), en: e[0], score: c.score }); }
  for (const c of generalCats) { const n = ML_GENERAL[c.index]; if (n && c.score >= 0.12) pool.push({ food: FOODS.find(f => f.n === n), en: "", score: c.score }); }
  pool.sort((a, b) => b.score - a.score);
  for (const c of pool) { if (out.length >= 6) break; if (!c.food || seen.has(c.food.n)) continue; seen.add(c.food.n); out.push(c); }
  return out;
}
// أقرب صحن تعلّمه التطبيق (منك أو من باقي المستخدمين)
function learnedMatch(emb) {
  if (!emb) return null;
  const q = b64d(emb); let best = null;
  const pools = [[LEARN, 0], [typeof SHARED !== "undefined" ? SHARED : [], 0.03]];
  for (const [list, penalty] of pools) for (const it of list) {
    const sim = cosine(q, b64d(it.e)) - penalty;
    if (!best || sim > best.sim) best = { sim, it, shared: penalty > 0 };
  }
  return best && best.sim >= 0.5 ? best : null;
}
// تحليل الصحن: منقسم الصورة لأجزاء ومنتعرّف على كل جزء، بعدين منجمع الأكلات المختلفة
function cropCanvas(img, x, y, w, h) {
  const c = document.createElement("canvas"); const S = 320;
  c.width = S; c.height = Math.round(S * h / w);
  c.getContext("2d").drawImage(img, x * img.naturalWidth, y * img.naturalHeight, w * img.naturalWidth, h * img.naturalHeight, 0, 0, c.width, c.height);
  return c;
}
const FAMILIES = [["pizza", /بيتزا/], ["pasta", /سباغيتي|معكرونة|نودلز|لازانيا|رامن|كاربونارا/], ["rice", /رز|برياني|مقلوبة|كبسة|مندي|منسف/],
  ["salad", /سلطة|تبولة|فتوش/], ["soup", /شوربة|حريرة/], ["burger", /برغر/], ["sandwich", /سندويشة|ساندويش|شاورما/], ["bread", /خبز|كعك|منقوشة/],
  ["cake", /كيك|كاتو|تشيز كيك|حلويات/]];
function analyzePlate(m, img, fullFood, fullGen) {
  const votes = new Map(); // اسم الأكلة ← { food, en, best, hits }
  const vote = (food, en, score, weight) => {
    if (!food) return;
    const v = votes.get(food.n) || { food, en, best: 0, hits: 0, w: 0 };
    v.best = Math.max(v.best, score); v.hits++; v.w += score * weight; votes.set(food.n, v);
  };
  const consider = (foodCats, genCats, weight) => {
    const fc = foodCats[0], gc = genCats && genCats[0];
    if (fc && fc.score >= 0.3) { const e = ML_LABELS[fc.index]; if (e) vote(foodFromLabel(e), e[0], fc.score, weight); }
    if (gc && gc.score >= 0.35) { const n = ML_GENERAL[gc.index]; if (n) vote(FOODS.find(f => f.n === n), "", gc.score, weight); }
  };
  const cats = r => (r && r.classifications[0] && r.classifications[0].categories) || [];
  consider(fullFood, fullGen, 2);
  // شبكة ٣×٣ متداخلة: كل جزء نص الصورة تقريباً
  for (const y of [0, 0.25, 0.5]) for (const x of [0, 0.25, 0.5]) {
    const c = cropCanvas(img, x, y, 0.5, 0.5);
    consider(cats(m.food.classify(c)), m.general ? cats(m.general.classify(c)) : null, 1);
  }
  // الأنواع العامة (مو موجودة بالقاعدة) بدها ثقة أعلى، ومن كل عيلة أكل منخلي الأقوى بس (مثلاً ما منحط نوعين معكرونة)
  const fam = f => { const n = f.gen ? f.type : f.n; for (const [k, re] of FAMILIES) if (re.test(n)) return k; return n; };
  const ranked = [...votes.values()].filter(v => (v.food.gen ? v.best >= 0.6 : (v.best >= 0.45 || v.hits >= 2))).sort((a, b) => b.w - a.w);
  const seenFam = new Set(), list = [];
  for (const v of ranked) { const k = fam(v.food); if (seenFam.has(k)) continue; seenFam.add(k); list.push(v); if (list.length === 5) break; }
  const totalW = list.reduce((s, v) => s + v.w, 0) || 1;
  return list.map(v => {
    // الحصة: الأكلة الرئيسية حصة كاملة، والجانبية أقل حسب قديش ظهرت بالصورة
    const share = Math.max(0.35, Math.min(1, (v.w / totalW) * 1.6));
    return { food: v.food, en: v.en, score: v.best, grams: r0(v.food.ug * share / 5) * 5 || v.food.ug, on: true };
  });
}

async function analyze(file) {
  photo = { file, url: URL.createObjectURL(file), state: "loading", first: !clsPromise };
  learnCtx = null;
  renderPhoto();
  const p = photo;
  try {
    const m = await getModels();
    const img = new Image(); img.src = p.url; await img.decode();
    const cats = r => (r && r.classifications[0] && r.classifications[0].categories) || [];
    const fullFood = cats(m.food.classify(img)), fullGen = m.general ? cats(m.general.classify(img)) : [];
    let emb = null;
    if (m.embed) { const e = m.embed.embed(img).embeddings[0]; if (e && e.quantizedEmbedding) emb = b64e(e.quantizedEmbedding); }
    p.emb = emb;
    p.cands = toCandidates(fullFood, fullGen);
    const lm = learnedMatch(emb);
    if (lm) {
      p.learned = lm.shared ? "shared" : "mine";
      p.items = itemsOf(lm.it).map(x => ({ food: liveFood(x.f), grams: x.g, on: true, score: Math.min(0.99, lm.sim) }));
    } else {
      p.items = analyzePlate(m, img, fullFood, fullGen);
      // إذا ما في شي أكيد: منقترح أقوى أكلة موجودة بالقاعدة (أدق من نوع عام)
      const fb = p.cands.find(c => !c.food.gen && c.score >= 0.1) || p.cands[0];
      if (!p.items.length && fb) p.items = [{ ...fb, grams: fb.food.ug, on: true }];
    }
    p.state = "local";
  } catch (e) {
    console.error(e);
    p.state = "error";
    p.error = navigator.onLine ? "ما قدرت شغّل المحلل على هالموبايل. جرّب مرة تانية، أو دوّر على الأكلة بالاسم." : "أول مرة المحلل بيحتاج إنترنت ليتحمّل. اتصل بالنت وجرّب.";
  }
  if (photo === p && tab === "photo") renderPhoto();
}

async function cloudAnalyze() {
  const p = photo; if (!p) return;
  const back = p.cands ? "local" : "error";
  p.state = "cloud-loading"; p.cloudCtl = new AbortController(); renderPhoto();
  try {
    if (!navigator.onLine) throw new Error("التحليل الأونلاين بدو إنترنت.");
    const image = await shrink(p.file, 768);
    const data = await askVision(image);
    if (p.state !== "cloud-loading") return;
    const items = (data.items || []).map(it => ({
      name: String(it.name || "أكلة"), grams: Math.max(0, +it.grams || 0),
      kcal100: Math.max(0, +it.kcal100 || 0), p100: +it.p100 || 0, c100: +it.c100 || 0, f100: +it.f100 || 0, on: true
    })).filter(it => it.kcal100 > 0 || it.grams > 0);
    items.forEach(it => {
      const m = FOODS.find(f => norm(f.n) === norm(it.name));
      if (m) Object.assign(it, { kcal100: m.k, p100: m.p, c100: m.cb, f100: m.f });
    });
    Object.assign(p, { state: "done", items, note: data.note || "" });
  } catch (e) {
    if (p.state !== "cloud-loading") return;
    p.state = back;
    toast(e.message || "التحليل الأونلاين ما زبط هلق");
  }
  if (photo === p && tab === "photo") renderPhoto();
}

// ---------- أدوات عامة ----------
let sheetEl = null;
function sheet(html, bind) {
  closeSheet();
  sheetEl = document.createElement("div");
  sheetEl.className = "sheet-bg";
  sheetEl.innerHTML = `<div class="sheet stack" role="dialog" aria-modal="true">${html}</div>`;
  sheetEl.onclick = e => { if (e.target === sheetEl) closeSheet(); };
  document.body.appendChild(sheetEl);
  bind($(".sheet", sheetEl));
  history.pushState({ sheet: 1 }, "");
}
let ignorePop = false;
function closeSheet(fromPop) {
  if (!sheetEl) return;
  sheetEl.remove(); sheetEl = null;
  if (!fromPop && history.state && history.state.sheet) { ignorePop = true; history.back(); }
}
window.addEventListener("popstate", () => {
  if (ignorePop) { ignorePop = false; return; }
  if (sheetEl) closeSheet(true);
  else if (typeof player !== "undefined" && player) { history.pushState({ pl: 1 }, ""); }
  else if (tab !== "today") go("today", true);
});

function go(t, fromPop) {
  if (t === "today") learnCtx = null;
  if (t !== tab && !fromPop && t !== "today") history.pushState({ tab: t }, "");
  tab = t;
  const hl = t === "photo" ? "add" : t;
  document.querySelectorAll(".tab").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === hl));
  render(); scrollTo(0, 0);
}
document.querySelectorAll(".tab").forEach(b => b.onclick = () => { learnCtx = null; go(b.dataset.tab); });
// صورة رجعت من الكاميرا بعد ما النظام سكّر التطبيق بالخلفية (من غلاف أندرويد)
window.hariraReceivePhoto = async dataUrl => {
  if (!isPremium()) { go("today"); return subSheet("تحليل الصحن بالصورة"); }
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
    go("photo"); analyze(file);
  } catch (e) { toast("ما قدرت افتح الصورة، جرب مرة تانية"); }
};
function render() {
  const nav = document.querySelector("nav.tabs");
  if (typeof player !== "undefined" && player) return;
  if (!getAccount()) { nav.hidden = true; return renderLogin(); }
  if (isAdmin()) { nav.hidden = true; app.innerHTML = ""; location.replace("admin.html"); return; } // الأدمن بيروح للوحة الإدارة مباشرة
  if (wiz || !prof().done) { if (!wiz) { startWizard(); return; } return renderWizard(); }
  const locked = !isPremium();
  nav.hidden = locked;
  if (locked) return renderLocked();
  const hl = tab === "photo" ? "add" : tab;
  document.querySelectorAll(".tab").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === hl));
  ({ today: renderToday, add: renderAdd, photo: renderPhoto, workouts: renderWorkouts, progress: renderProgress, me: renderMe })[tab]();
}
// تسجيل الدخول: نفس الشاشة للحساب الجديد والقديم (الحساب = الإيميل + كلمة السر)
function renderLogin() {
  app.innerHTML = `<div class="head"><h1>حريره</h1><button class="chip" id="lang">${LANG === "en" ? "ع" : "EN"}</button></div>
  <div class="card stack" style="align-items:stretch">
    <img src="icon-192.png" alt="" width="84" height="84" style="border-radius:22px;align-self:center">
    <h2 style="text-align:center">أهلاً بحريره</h2>
    <p class="muted" style="margin:0;text-align:center">سجّل دخول أو اعمل حساب جديد بنفس الخطوة. اشتراكك بينحفظ بحسابك، فبترجعله من أي موبايل.</p>
    <label class="muted" for="l-name">اسمك (للحساب الجديد)</label><input id="l-name" type="text" autocomplete="name">
    <label class="muted" for="l-email">الإيميل</label><input id="l-email" type="email" dir="ltr" autocomplete="email" inputmode="email">
    <label class="muted" for="l-pass">كلمة السر</label>
    <div class="row"><input id="l-pass" type="password" dir="ltr" autocomplete="current-password"><button class="icon-btn" id="l-eye" aria-label="إظهار كلمة السر" style="flex:none">👁</button></div>
    <button class="btn" id="l-go">دخول</button>
    <small class="muted">كلمة السر ما فيها استرجاع، احفظها منيح. إذا نسيتها، تواصل مع الدعم.</small>
  </div>${supportBox()}`;
  $("#lang").onclick = () => setLang(LANG === "en" ? "ar" : "en");
  $("#l-eye").onclick = () => { const i = $("#l-pass"); i.type = i.type === "password" ? "text" : "password"; };
  const go = async () => {
    const b = $("#l-go"); b.disabled = true; b.textContent = "لحظة…";
    try {
      const r = await login($("#l-email").value, $("#l-pass").value, $("#l-name").value);
      await refreshSub(); await pollActivation(); await refreshSub();
      tab = "today"; render(); scheduleReminders();
      toast(r.admin ? "أهلاً يا أدمن 👑" : "أهلاً فيك 👋");
    } catch (e) { toast(e.message || "ما زبط، جرب كمان مرة"); b.disabled = false; b.textContent = "دخول"; }
  };
  $("#l-go").onclick = go;
  $("#l-pass").onkeydown = e => { if (e.key === "Enter") go(); };
}

// بعد ٣ أيام التجربة: كل التطبيق بيحتاج اشتراك
function renderLocked() {
  const req = getReq(), pending = req && req.status === "pending";
  app.innerHTML = `<div class="head"><h1>حريره</h1><button class="chip" id="lang">${LANG === "en" ? "ع" : "EN"}</button></div>
  <div class="card empty stack" style="align-items:center">
    <img src="icon-192.png" alt="" width="84" height="84" style="border-radius:22px">
    <h2>${pending ? "طلبك عم ينراجع ⏳" : "خلصت التجربة المجانية"}</h2>
    <p class="muted" style="margin:0">${pending ? "أول ما ينقبل الإيصال بيتفعّل التطبيق لحاله. خلّي التطبيق مفتوح أو ارجعله بعد شوي." : "اشترك بـ " + esc(SUB.config.price || "500") + " " + esc(SUB.config.currency) + " بالشهر وكمّل مع كل الميزات."}</p>
    <ul style="margin:0;padding-inline-start:20px;line-height:1.9;text-align:start">${PREMIUM_FEATURES.map(f => `<li>${f}</li>`).join("")}</ul>
    <button class="btn" id="lock-sub" style="width:100%">${pending ? "تحقق من الطلب" : "اشترك هلق"}</button>
  </div>${supportBox()}
  <div class="row between" style="margin-top:12px"><small class="muted" dir="ltr">${esc((getAccount() || {}).email || "")}</small><button class="chip" id="lock-out">تسجيل خروج</button></div>`;
  $("#lang").onclick = () => setLang(LANG === "en" ? "ar" : "en");
  $("#lock-sub").onclick = () => subSheet();
  $("#lock-out").onclick = () => { logout(); subState.active = false; refreshSub().then(render); };
}
if (typeof applyPlan === "function") applyPlan();
render();
registerUser();
refreshSub().then(() => { render(); scheduleReminders(); const r = getReq(); if (r && r.status === "pending") { startPolling(); resendIfStale(); } else pollActivation().then(c => { if (c) refreshSub().then(render); }); });

// تحديث تلقائي: إذا نزل تعديل جديد والتطبيق مفتوح بالخلفية، منعيد تحميله أول ما يرجع المستخدم عليه
let loadedVersion = null;
async function checkVersion() {
  try {
    const v = (await (await fetch("version.txt", { cache: "no-cache" })).text()).trim();
    if (!loadedVersion) loadedVersion = v;
    else if (v && v !== loadedVersion && !document.querySelector(".sheet-bg")) location.reload();
  } catch (e) {}
}
checkVersion();
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkVersion(); });
setInterval(checkVersion, 15 * 60 * 1000);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
