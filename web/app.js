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
      ${items.map(({ e, i }) => `<div class="entry"><div class="t"><b>${esc(e.n)}</b><small class="muted num">${fmt(e.g)} غرام${e.src ? " · من صورة" : ""}</small></div>
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

function qtySheet(f, src, g0) {
  let g = g0 || f.ug;
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
      addEntry({ n: f.n, g, ...v, meal: $("#meal", el).value, ...(src ? { src } : {}) });
      closeSheet(); toast(`انضافت: ${f.n} (${fmt(v.k)} سعرة)`);
      if (src === "photo") { photo = null; go("today"); }
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
      const best = p.cands[0] ? p.cands[0].score : 0;
      const mul = SIZES[p.size || 1][1];
      inner = p.cands.length ? `<div class="stack" style="gap:8px"><b>شو هالأكلة؟ اختار الصح:</b>
        <div class="row" style="flex-wrap:wrap;gap:6px"><span class="muted" style="font-size:13px">حجم الحصة:</span>${SIZES.map((z, i) => `<button class="chip" data-size="${i}" aria-pressed="${(p.size || 1) === i}">${z[0]}</button>`).join("")}</div>
        <div class="foods">${p.cands.map((c, i) => { const g = r0(c.food.ug * mul / 5) * 5; return `<button class="food" data-cand="${i}">
          <span class="t">${esc(c.food.gen ? c.food.type : c.food.n)}<small>${c.food.gen ? esc(c.en) + " · " : ""}تقريباً ${fmt(g)} غ (${esc(c.food.u)}) · ${fmt(c.score * 100)}٪ ثقة</small></span>
          <span class="k num">≈ ${fmt(c.food.k * g / 100)}<small class="muted" style="display:block">سعرة</small></span></button>`; }).join("")}</div></div>
        ${best < 0.25 ? `<p class="note">مو متأكد كتير من هالصورة. إذا ولا وحدة صح، دوّر عليها بالاسم.</p>` : ""}`
        : `<p style="margin:0">ما قدرت ميّز أكل بهالصورة. جرّب صورة أقرب وأوضح.</p>`;
      inner += `<div class="row" style="flex-wrap:wrap"><button class="btn ghost" data-go="add">ما لقيت أكلتي، دوّر بالاسم</button></div>
        <button class="chip" id="cloud" style="align-self:flex-start">تحليل أونلاين للصحن كلو مع الغرامات (أبطأ)</button>`;
    } else if (p.state === "done") {
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
  const cloud = $("#cloud"); if (cloud) cloud.onclick = () => cloudAnalyze();
  const cc = $("#cancel-cloud"); if (cc) cc.onclick = () => { p.cloudCtl && p.cloudCtl.abort(); p.state = p.cands ? "local" : "error"; renderPhoto(); };
  app.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(b.dataset.go));
  app.querySelectorAll("[data-size]").forEach(b => b.onclick = () => { p.size = +b.dataset.size; renderPhoto(); });
  app.querySelectorAll("[data-cand]").forEach(b => b.onclick = () => { const f = p.cands[+b.dataset.cand].food; qtySheet(f, "photo", r0(f.ug * SIZES[p.size || 1][1] / 5) * 5); });
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
function getClassifier() {
  if (!clsPromise) {
    clsPromise = (async () => {
      if (typeof ML_LABELS === "undefined") await loadScript("ml/labels.js");
      const { FilesetResolver, ImageClassifier } = await import(new URL("ml/vision_bundle.mjs", location.href).href);
      const files = await FilesetResolver.forVisionTasks(new URL("ml/wasm", location.href).href);
      return ImageClassifier.createFromOptions(files, { baseOptions: { modelAssetPath: new URL("ml/food.tflite", location.href).href }, maxResults: 30, runningMode: "IMAGE" });
    })();
    clsPromise.catch(() => { clsPromise = null; });
  }
  return clsPromise;
}
// نتائج الموديل ← أكلات من القاعدة، أو نوع عام بسعرات تقريبية إذا الأكلة مو عنا
function toCandidates(categories) {
  const out = [], seen = new Set();
  for (const c of categories) {
    const e = ML_LABELS[c.index];
    if (!e) continue;
    let food;
    if (e[1]) food = FOODS.find(f => f.n === e[1]);
    else food = { n: `${e[2]} (${e[0]})`, type: e[2], c: "من صورة", k: e[3], p: e[4], cb: e[5], f: e[6], u: e[7], ug: e[8], gen: true };
    if (!food || seen.has(food.n)) continue;
    seen.add(food.n);
    out.push({ food, en: e[0], score: c.score });
    if (out.length === 3) break;
  }
  return out;
}

// الموديلات المجانية اللي بتفهم الصور، منجيبها من OpenRouter ومنحفظها يوم
async function visionModels() {
  try { const c = JSON.parse(localStorage.getItem("harira-models3") || "null"); if (c && Date.now() - c.t < 864e5 && c.list.length) return c.list; } catch (e) {}
  const pref = ["gemma", "llama-4", "qwen", "mistral", "gemini", "kimi", "nemotron"];
  let list = [], paid = [];
  try {
    const r = await fetch(OR + "/models");
    const all = ((await r.json()).data || []).filter(m => ((m.architecture && m.architecture.input_modalities) || []).includes("image") && !/safety|guard|embed|inkling/i.test(m.id));
    // الموديل الأساسي: أحدث Gemini Flash (سريع ودقيق ورخيص جداً، بيشتغل إذا الحساب فيه رصيد)
    const ver = id => parseFloat((id.match(/gemini-([\d.]+)/) || [])[1] || 0);
    paid = all.map(m => m.id).filter(id => /^google\/gemini-[\d.]+-flash(-preview)?$/.test(id)).sort((x, y) => ver(y) - ver(x)).slice(0, 1);
    list = all.map(m => m.id).filter(id => /:free$/.test(id));
    const rank = id => { const i = pref.findIndex(p => id.toLowerCase().includes(p)); return i < 0 ? 99 : i; };
    list.sort((x, y) => rank(x) - rank(y));
  } catch (e) {}
  if (!paid.length) paid = ["google/gemini-2.5-flash"];
  list = [...paid, ...list];
  try { localStorage.setItem("harira-models3", JSON.stringify({ t: Date.now(), list })); } catch (e) {}
  return list;
}
function parseJSON(t) {
  const f = String(t || "").match(/```(?:json)?\s*([\s\S]*?)```/); const b = f ? f[1] : String(t || "");
  const a = b.indexOf("{"), z = b.lastIndexOf("}"); if (a < 0 || z < a) throw new Error("bad json");
  return JSON.parse(b.slice(a, z + 1));
}
async function askVision(dataUrl) {
  const models = (await visionModels()).slice(0, 4);
  let last = "الخدمة مشغولة هلق. جرب بعد شوي.";
  for (const model of models) {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), model.endsWith(":free") ? 25000 : 30000);
    try {
      const r = await fetch(OR + "/chat/completions", {
        method: "POST", signal: ctl.signal,
        headers: { "Authorization": "Bearer " + ORK, "Content-Type": "application/json", "HTTP-Referer": "https://mohamedfayzyasenalsabagh-create.github.io/harira/", "X-Title": "Harira" },
        body: JSON.stringify({ model, temperature: 0.2, max_tokens: 4000, reasoning: { effort: "low", exclude: true },
          messages: [{ role: "user", content: [{ type: "text", text: AI_PROMPT }, { type: "image_url", image_url: { url: dataUrl } }] }] })
      });
      const raw = await r.text();
      let j = {};
      try { j = JSON.parse(raw.split("\n").filter(l => !l.startsWith(":")).join("\n").trim() || "{}"); } catch (e) { if (globalThis.HARIRA_DEBUG) console.log(model, "RAW", raw.slice(0, 400)); }
      if (r.status === 401 || r.status === 403) { last = "في مشكلة بمفتاح خدمة الصور. خبّر صاحب التطبيق."; if (r.status === 401) break; continue; }
      if (r.status === 402) { if (!model.endsWith(":free")) continue; last = "خلص رصيد خدمة الصور. خبّر صاحب التطبيق."; break; }
      if (r.status === 429) {
        const msg = JSON.stringify(j).toLowerCase();
        if (msg.includes("per-day") || msg.includes("per day") || msg.includes("free-models-per-day")) { last = "خلص حد التحليل المجاني لليوم. جرب بكرا، أو اختار الأكلة يدوياً."; break; }
        last = "الخدمة مزحومة هلق. جرب بعد شوي."; continue;
      }
      if (globalThis.HARIRA_DEBUG) console.log(model, r.status, JSON.stringify(j).slice(0, 300));
      if (!r.ok) continue;
      const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      return parseJSON(Array.isArray(text) ? text.map(x => x.text || "").join("") : text);
    } catch (e) { if (globalThis.HARIRA_DEBUG) console.log(model, "ERR", e.name, e.message); if (e.name === "AbortError") last = "التحليل طوّل كتير. جرب مرة تانية."; }
    finally { clearTimeout(timer); }
  }
  throw new Error(last);
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
  photo = { file, url: URL.createObjectURL(file), state: "loading", first: !clsPromise };
  renderPhoto();
  const p = photo;
  try {
    const cls = await getClassifier();
    const img = new Image(); img.src = p.url; await img.decode();
    const r = cls.classify(img);
    p.cands = toCandidates((r.classifications[0] && r.classifications[0].categories) || []);
    p.state = "local";
  } catch (e) {
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
// صورة رجعت من الكاميرا بعد ما النظام سكّر التطبيق بالخلفية (من غلاف أندرويد)
window.hariraReceivePhoto = async dataUrl => {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
    go("photo"); analyze(file);
  } catch (e) { toast("ما قدرت افتح الصورة، جرب مرة تانية"); }
};
function render() { ({ today: renderToday, add: renderAdd, photo: renderPhoto })[tab](); }
render();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
