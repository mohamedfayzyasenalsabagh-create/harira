// حريره: حاسبة السعرات. كل البيانات محفوظة على جهاز المستخدم فقط
const AI_URL = ""; // رابط خادم تحليل الصور (Cloudflare Worker)
const MEALS = ["فطور", "غداء", "عشاء", "سناك"];
const app = document.getElementById("app");
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const r0 = n => Math.round(n);
const r1 = n => Math.round(n * 10) / 10;
const fmt = n => r0(n).toLocaleString("ar-SY");
const fmt1 = n => r1(n).toLocaleString("ar-SY");

// ---------- التخزين ----------
let S = { goal: 2000, days: {} };
try { S = Object.assign(S, JSON.parse(localStorage.getItem("harira") || "{}")); } catch (e) {}
function save() { try { localStorage.setItem("harira", JSON.stringify(S)); } catch (e) {} }

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
  return day.toLocaleDateString("ar-SY", { weekday: "long", day: "numeric", month: "long" });
}

// ---------- شاشة اليوم ----------
function renderToday() {
  const list = entries();
  const tot = list.reduce((a, e) => ({ k: a.k + e.k, p: a.p + e.p, cb: a.cb + e.cb, f: a.f + e.f }), { k: 0, p: 0, cb: 0, f: 0 });
  const goal = S.goal || 2000;
  const pct = Math.min(tot.k / goal, 1);
  const over = tot.k > goal;
  const C = 2 * Math.PI * 62;
  const left = goal - tot.k;
  // أهداف تقريبية للعناصر: 25% بروتين، 50% كربوهيدرات، 25% دهون من هدف السعرات
  const tg = { p: goal * .25 / 4, cb: goal * .5 / 4, f: goal * .25 / 9 };
  const macro = (name, v, t, color) => `<div class="macro"><div class="lbl"><span>${name}</span><span class="num muted">${fmt(v)} / ${fmt(t)} غ</span></div>
    <div class="bar"><i style="width:${Math.min(v / t, 1) * 100}%;background:${color}"></i></div></div>`;

  const byMeal = MEALS.map(m => {
    const items = list.map((e, i) => ({ e, i })).filter(x => (x.e.meal || "سناك") === m);
    if (!items.length) return "";
    const sum = items.reduce((a, x) => a + x.e.k, 0);
    return `<div class="card meal"><div class="row between"><h2>${m}</h2><span class="num muted">${fmt(sum)} سعرة</span></div>
      ${items.map(({ e, i }) => `<div class="entry"><div class="t"><b>${esc(e.n)}</b><small class="muted num">${fmt(e.g)} غرام${e.src === "ai" ? " · من صورة" : ""}</small></div>
        <span class="k num">${fmt(e.k)}</span><button class="del" data-del="${i}" aria-label="احذف ${esc(e.n)}">×</button></div>`).join("")}</div>`;
  }).join("");

  app.innerHTML = `
  <div class="head"><h1>حريره</h1>
    <div class="datebar"><button class="icon-btn" id="prev" aria-label="اليوم السابق">›</button><span>${dayLabel()}</span><button class="icon-btn" id="next" aria-label="اليوم التالي" ${key(day) === key(new Date()) ? "disabled style=\"opacity:.35\"" : ""}>‹</button></div></div>
  <div class="stack">
    <div class="card ring-wrap">
      <div class="ring">
        <svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="62" fill="none" stroke="var(--line)" stroke-width="12"/>
          <circle cx="70" cy="70" r="62" fill="none" stroke="${over ? "var(--tomato)" : "var(--herb)"}" stroke-width="12" stroke-linecap="round"
            stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>
        <div class="mid"><span class="big num">${fmt(tot.k)}</span><small class="muted">سعرة</small></div>
      </div>
      <div class="macros">
        <div class="row between"><span>${over ? "زيادة" : "باقي"} <b class="num" style="color:${over ? "var(--tomato)" : "var(--herb)"}">${fmt(Math.abs(left))}</b></span>
          <button class="chip" id="goal">الهدف: <span class="num">${fmt(goal)}</span></button></div>
        ${macro("بروتين", tot.p, tg.p, "var(--herb)")}
        ${macro("كربوهيدرات", tot.cb, tg.cb, "var(--saffron)")}
        ${macro("دهون", tot.f, tg.f, "var(--lentil)")}
      </div>
    </div>
    ${byMeal || `<div class="card empty"><div class="bowl">ح</div><p>ما سجلت شي ${dayLabel() === "اليوم" ? "اليوم" : "بهاليوم"} لسا.</p>
      <div class="row" style="justify-content:center;flex-wrap:wrap"><button class="btn" data-go="add">اختار أكلة</button><button class="btn ghost" data-go="photo">صوّر صحنك</button></div></div>`}
    ${weekCard()}
  </div>`;

  $("#prev").onclick = () => { day.setDate(day.getDate() - 1); render(); };
  $("#next").onclick = () => { if (key(day) !== key(new Date())) { day.setDate(day.getDate() + 1); render(); } };
  $("#goal").onclick = goalSheet;
  app.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
    const l = entries(); l.splice(+b.dataset.del, 1); save(); render();
  });
  app.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(b.dataset.go));
}

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
    const x = W - bw - i * (bw + gap); // من اليمين لليسار
    const lbl = days[i].toLocaleDateString("ar-SY", { weekday: "short" });
    return `<rect x="${x}" y="${H - h}" width="${bw}" height="${h}" rx="6" fill="${v > goal ? "var(--tomato)" : "var(--herb)"}" opacity="${key(days[i]) === key(day) ? 1 : .55}"/>
      <text x="${x + bw / 2}" y="${H + 18}" text-anchor="middle" font-size="11" fill="var(--muted)">${lbl}</text>`;
  }).join("");
  return `<div class="card"><div class="row between"><h2>آخر ٧ أيام</h2><small class="muted">الخط = هدفك</small></div>
    <svg viewBox="0 0 ${W} ${H + 26}" style="width:100%;margin-top:10px" role="img" aria-label="السعرات خلال آخر سبعة أيام">
      <line x1="0" x2="${W}" y1="${gy}" y2="${gy}" stroke="var(--saffron)" stroke-dasharray="4 4" stroke-width="1.5"/>${bars}</svg></div>`;
}

function goalSheet() {
  sheet(`<h2>هدفك اليومي</h2>
    <label class="muted" for="g-in">كم سعرة بدك تاكل باليوم؟</label>
    <input id="g-in" type="number" inputmode="numeric" min="800" max="6000" value="${S.goal || 2000}">
    <div class="quick">${[1500, 1800, 2000, 2200, 2500, 3000].map(v => `<button class="chip" data-v="${v}">${fmt(v)}</button>`).join("")}</div>
    <p class="muted" style="margin:0;font-size:13px">الاحتياج بيختلف حسب العمر والوزن والنشاط. إذا عندك حالة صحية، اسأل طبيب أو أخصائي تغذية.</p>
    <button class="btn" id="g-save">احفظ</button>`, el => {
    el.querySelectorAll("[data-v]").forEach(b => b.onclick = () => $("#g-in", el).value = b.dataset.v);
    $("#g-save", el).onclick = () => {
      const v = Math.round(+$("#g-in", el).value);
      if (v >= 800 && v <= 6000) { S.goal = v; save(); closeSheet(); render(); }
      else toast("اكتب رقم بين ٨٠٠ و٦٠٠٠");
    };
  });
}

// ---------- شاشة إضافة أكلة ----------
const norm = s => s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[ًٌٍَُِّْ]/g, "").toLowerCase();
function renderAdd() {
  const cats = ["الكل", ...new Set(FOODS.map(f => f.c))];
  app.innerHTML = `
  <div class="head"><h1>أضف أكلة</h1><span class="muted">${dayLabel()}</span></div>
  <div class="stack">
    <input id="q" type="search" placeholder="دوّر: رز، شاورما، تفاح…" value="${esc(query)}" aria-label="ابحث عن أكلة">
    <div class="chips">${cats.map(c => `<button class="chip" aria-pressed="${c === cat}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <div class="card foods" id="list"></div>
    <p class="muted" style="font-size:12px;margin:0">القيم تقريبية لكل ١٠٠ غرام، وبتختلف حسب طريقة الطبخ والمكونات.</p>
  </div>`;
  const q = $("#q");
  q.oninput = () => { query = q.value; drawList(); };
  app.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { cat = b.dataset.cat; renderAdd(); });
  drawList();
}
function drawList() {
  const nq = norm(query.trim());
  let list = FOODS.filter(f => (cat === "الكل" || f.c === cat) && (!nq || norm(f.n).includes(nq)));
  if (nq) list.sort((a, b) => norm(a.n).indexOf(nq) - norm(b.n).indexOf(nq));
  $("#list").innerHTML = list.length ? list.slice(0, 120).map(f => `<button class="food" data-id="${f.id}">
      <span class="t">${esc(f.n)}<small>${esc(f.c)} · ١ ${esc(f.u)} ≈ ${fmt(f.ug)} غ</small></span>
      <span class="k num">${fmt(f.k)} <small class="muted">/١٠٠غ</small></span></button>`).join("")
    : `<div class="empty"><p>ما لقيت "${esc(query)}".</p><p class="muted">جرّب اسم تاني، أو صوّر الأكلة من تبويب "من صورة".</p></div>`;
  $("#list").querySelectorAll("[data-id]").forEach(b => b.onclick = () => qtySheet(FOODS[+b.dataset.id]));
}

function qtySheet(f) {
  let g = f.ug;
  let meal = guessMeal();
  sheet(`<div class="row between"><h2>${esc(f.n)}</h2><span class="muted num">${fmt(f.k)} سعرة/١٠٠غ</span></div>
    <label class="muted" for="gr">الكمية بالغرام</label>
    <div class="qty"><button class="icon-btn" id="minus" aria-label="أنقص">−</button>
      <input id="gr" type="number" inputmode="decimal" min="1" value="${g}"><button class="icon-btn" id="plus" aria-label="زيد">+</button></div>
    <div class="quick">
      <button class="chip" data-g="${f.ug}">١ ${esc(f.u)}</button><button class="chip" data-g="${f.ug * 2}">٢ ${esc(f.u)}</button>
      <button class="chip" data-g="${r0(f.ug / 2)}">نص ${esc(f.u)}</button><button class="chip" data-g="100">١٠٠ غ</button></div>
    <div class="result" id="res"></div>
    <label class="muted" for="meal">الوجبة</label>
    <select id="meal">${MEALS.map(m => `<option ${m === meal ? "selected" : ""}>${m}</option>`).join("")}</select>
    <button class="btn" id="add">أضف للسجل</button>`, el => {
    const gr = $("#gr", el);
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
      addEntry({ n: f.n, g, ...v, meal: $("#meal", el).value });
      closeSheet(); toast(`انضافت: ${f.n} (${fmt(v.k)} سعرة)`);
    };
    upd();
  });
}

// ---------- شاشة الصورة ----------
let photo = null; // { url, blob, items, note, state }
function renderPhoto() {
  const p = photo;
  let body;
  if (!p) {
    body = `<div class="card drop">
      <div class="bowl" style="font-family:var(--display);font-size:44px;color:var(--saffron)">ح</div>
      <p style="margin:0">صوّر صحنك من فوق وبضوء منيح، وأنا بقدّرلك شو فيه وكم سعراته.</p>
      <div class="row" style="flex-wrap:wrap;justify-content:center">
        <label class="btn" for="cam">صوّر</label><label class="btn ghost" for="gal">اختار من المعرض</label></div>
      <input id="cam" type="file" accept="image/*" capture="environment" hidden>
      <input id="gal" type="file" accept="image/*" hidden></div>
      <p class="note">التقدير بالصورة تقريبي. إذا بتعرف الكمية بالغرام، عدّلها قبل ما تضيف.</p>`;
  } else {
    let inner = "";
    if (p.state === "loading") inner = `<div class="row" style="justify-content:center;padding:18px"><div class="spinner"></div><span>عم حلل الصورة…</span></div>`;
    else if (p.state === "error") inner = `<p style="color:var(--tomato);margin:0">${esc(p.error)}</p><button class="btn" id="retry">جرّب مرة تانية</button>`;
    else if (p.state === "done") {
      inner = p.items.length ? `<div>${p.items.map((it, i) => `<div class="ai-item">
          <input type="checkbox" data-chk="${i}" ${it.on ? "checked" : ""} aria-label="ضمّن ${esc(it.name)}">
          <div><b>${esc(it.name)}</b><small class="muted num" style="display:block" id="k${i}">${fmt(it.kcal100 * it.grams / 100)} سعرة</small></div>
          <label><input type="number" inputmode="decimal" data-g="${i}" value="${r0(it.grams)}" aria-label="غرامات ${esc(it.name)}"><small class="muted">غرام</small></label></div>`).join("")}</div>
        <div class="row between"><b>المجموع</b><b class="num" id="aitot" style="color:var(--tomato)"></b></div>
        <select id="ai-meal" aria-label="الوجبة">${MEALS.map(m => `<option ${m === guessMeal() ? "selected" : ""}>${m}</option>`).join("")}</select>
        <button class="btn" id="ai-add">أضف للسجل</button>`
        : `<p style="margin:0">ما قدرت ميّز أكل بهالصورة. جرّب صورة أوضح، أو اختار الأكلة يدوياً.</p>`;
      if (p.note) inner += `<p class="note">${esc(p.note)}</p>`;
    }
    body = `<div class="card stack"><img class="preview" src="${p.url}" alt="صورة الأكلة">${inner}
      <button class="btn ghost" id="again">صورة جديدة</button></div>`;
  }
  app.innerHTML = `<div class="head"><h1>من صورة</h1><span class="muted">${dayLabel()}</span></div><div class="stack">${body}</div>`;

  ["cam", "gal"].forEach(id => { const el = $("#" + id); if (el) el.onchange = () => el.files[0] && analyze(el.files[0]); });
  const again = $("#again"); if (again) again.onclick = () => { photo = null; renderPhoto(); };
  const retry = $("#retry"); if (retry) retry.onclick = () => analyze(p.file);
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

// تصغير الصورة قبل الإرسال لتسريع التحليل وتوفير الإنترنت
function shrink(file, max = 1024) {
  return new Promise((ok, bad) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      ok(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => bad(new Error("ما قدرت افتح الصورة"));
    img.src = URL.createObjectURL(file);
  });
}

async function analyze(file) {
  photo = { file, url: URL.createObjectURL(file), state: "loading", items: [] };
  renderPhoto();
  try {
    if (!AI_URL) throw new Error("تحليل الصور عم يتجهز وقريباً بيشتغل. لهلق فيك تختار الأكلة يدوياً من تبويب «أضف أكلة».");
    if (!navigator.onLine) throw new Error("تحليل الصور بدو إنترنت. تأكد من الاتصال وجرب مرة تانية.");
    const image = await shrink(file);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 60000);
    const res = await fetch(AI_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }), signal: ctl.signal });
    clearTimeout(timer);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "الخادم مشغول هلق. جرب بعد شوي.");
    const items = (data.items || []).map(it => ({
      name: String(it.name || "أكلة"), grams: Math.max(0, +it.grams || 0),
      kcal100: Math.max(0, +it.kcal100 || 0), p100: +it.p100 || 0, c100: +it.c100 || 0, f100: +it.f100 || 0, on: true
    })).filter(it => it.kcal100 > 0 || it.grams > 0);
    // إذا الأكلة موجودة بقاعدتنا منعتمد قيمها لأنها أدق
    items.forEach(it => {
      const m = FOODS.find(f => norm(f.n) === norm(it.name));
      if (m) Object.assign(it, { kcal100: m.k, p100: m.p, c100: m.cb, f100: m.f });
    });
    Object.assign(photo, { state: "done", items, note: data.note || "" });
  } catch (e) {
    Object.assign(photo, { state: "error", error: e.name === "AbortError" ? "التحليل طوّل كتير. جرب مرة تانية." : (e.message || "صار خطأ") });
  }
  if (tab === "photo") renderPhoto();
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
function closeSheet(fromPop) {
  if (!sheetEl) return;
  sheetEl.remove(); sheetEl = null;
  if (!fromPop && history.state && history.state.sheet) history.back();
}
window.addEventListener("popstate", () => { if (sheetEl) closeSheet(true); else if (tab !== "today") go("today", true); });

function go(t, fromPop) {
  if (t !== tab && !fromPop && t !== "today") history.pushState({ tab: t }, "");
  tab = t;
  document.querySelectorAll(".tab").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
  render(); scrollTo(0, 0);
}
document.querySelectorAll(".tab").forEach(b => b.onclick = () => go(b.dataset.tab));
function render() { ({ today: renderToday, add: renderAdd, photo: renderPhoto })[tab](); }
render();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
