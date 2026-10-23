// قسم "أنا": معلومات الجسم والهدف، والخطة المحسوبة منها (سعرات، بروتين، مي، تاريخ الوصول)
const ACTS = [["قليل الحركة", "شغل مكتبي، بدون رياضة", 1.2], ["خفيف", "رياضة ١-٣ أيام بالأسبوع", 1.375], ["متوسط", "رياضة ٣-٥ أيام", 1.55], ["نشيط", "رياضة ٦-٧ أيام", 1.725], ["نشيط جداً", "شغل بدني أو تمرين مرتين باليوم", 1.9]];
const GOALS = [["تنحيف", "خسارة دهون مع الحفاظ على العضل", -1], ["تثبيت", "الحفاظ على وزنك وتحسين لياقتك", 0], ["تضخيم", "زيادة عضل ووزن صحي", 1]];
const PACES = [0.25, 0.5, 0.75, 1];

function prof() { return S.profile || {}; }
function curWeight() { return latestWeight() || prof().w || 70; }
function startWeight() { const w = S.weights || {}, k = Object.keys(w).sort()[0]; return k ? w[k] : prof().w || curWeight(); }

// الخطة: Mifflin-St Jeor للحرق الأساسي × النشاط، وبعدين عجز أو فائض حسب الهدف والسرعة
function planFor(p) {
  p = Object.assign({ sex: "m", a: 30, h: 170, act: 1, goal: 0, pace: 0.5 }, p);
  const w = p.wNow || p.w || 70;
  const bmr = 10 * w + 6.25 * p.h - 5 * p.a + (p.sex === "m" ? 5 : -161);
  const tdee = bmr * ACTS[p.act][2];
  const dir = GOALS[p.goal][2];
  const delta = dir === 0 ? 0 : dir * p.pace * 7700 / 7;
  const floor = p.sex === "m" ? 1500 : 1200;
  let kcal = Math.round((tdee + delta) / 10) * 10;
  const floored = kcal < floor; if (floored) kcal = floor;
  const protein = Math.round(w * (dir === 0 ? 1.4 : 1.8));
  const fat = Math.round(kcal * 0.27 / 9);
  const carbs = Math.max(50, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const water = Math.round(w * 35 / 50) * 50; // مل
  const bmi = w / Math.pow(p.h / 100, 2);
  let eta = null;
  if (p.tw && dir !== 0 && Math.sign(p.tw - w) === dir) {
    const realPace = floored ? Math.max(0.1, (tdee - kcal) * 7 / 7700) : p.pace;
    eta = new Date(Date.now() + Math.abs(p.tw - w) / realPace * 7 * 864e5);
  }
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, protein, fat, carbs, water, bmi, eta, floored };
}
function bmiCat(b) { return b < 18.5 ? ["نحافة", "var(--water)"] : b < 25 ? ["وزن طبيعي", "var(--herb)"] : b < 30 ? ["زيادة وزن", "var(--saffron)"] : ["سمنة", "var(--tomato)"]; }
function myPlan() { return planFor({ ...prof(), wNow: curWeight() }); }
// تحديث الهدف اليومي من الخطة (إلا إذا المستخدم حاطط رقمه بإيده)
function applyPlan() {
  if (!prof().done) return;
  const pl = myPlan();
  if (!S.goalManual) S.goal = pl.kcal;
  S.macros = { p: pl.protein, cb: pl.carbs, f: pl.fat };
  S.waterMl = pl.water;
  save();
}

// ===== خطوات الترحيب =====
let wiz = null;
function startWizard() { wiz = { step: 0, p: Object.assign({ sex: "", a: "", h: "", w: "", tw: "", act: 1, goal: 0, pace: 0.5, name: (getAccount() || {}).name || "" }, prof()) }; render(); }
const WIZ_STEPS = ["sex", "age", "height", "weight", "target", "activity", "goal", "plan"];
function renderWizard() {
  document.querySelector("nav.tabs").hidden = true;
  const p = wiz.p, st = WIZ_STEPS[wiz.step], n = WIZ_STEPS.length;
  const num = (id, val, unit, min, max, step = 1) => `<div class="big-input"><input id="${id}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${val}"><span>${unit}</span></div>`;
  let title = "", body = "";
  if (st === "sex") { title = "أهلاً" + (p.name ? " " + esc(p.name) : "") + "! خلينا نبني خطتك"; body = `<p class="muted">كل شي بنحسبه حسب جسمك. اختار الجنس:</p>
    <div class="choice-grid">${[["m", "ذكر", "♂"], ["f", "أنثى", "♀"]].map(([v, l, i]) => `<button class="choice ${p.sex === v ? "on" : ""}" data-v="${v}"><span class="ci">${i}</span>${l}</button>`).join("")}</div>`; }
  if (st === "age") { title = "كم عمرك؟"; body = num("wv", p.a, "سنة", 12, 90); }
  if (st === "height") { title = "كم طولك؟"; body = num("wv", p.h, "سم", 120, 230); }
  if (st === "weight") { title = "كم وزنك هلق؟"; body = num("wv", p.w, "كغ", 30, 300, 0.1); }
  if (st === "target") { title = "شو الوزن اللي بتحلم فيه؟"; body = num("wv", p.tw, "كغ", 30, 300, 0.1) + `<p class="muted" id="tw-hint"></p>`; }
  if (st === "activity") { title = "قديش بتتحرك عادةً؟"; body = `<div class="choice-list">${ACTS.map((x, i) => `<button class="choice row-choice ${+p.act === i ? "on" : ""}" data-v="${i}"><b>${x[0]}</b><small>${x[1]}</small></button>`).join("")}</div>`; }
  if (st === "goal") { title = "شو هدفك؟"; body = `<div class="choice-list">${GOALS.map((x, i) => `<button class="choice row-choice ${+p.goal === i ? "on" : ""}" data-v="${i}"><b>${x[0]}</b><small>${x[1]}</small></button>`).join("")}</div>
    ${+p.goal !== 1 ? `<p class="muted" style="margin:6px 0 0">السرعة بالأسبوع:</p><div class="row" style="flex-wrap:wrap;gap:8px">${PACES.map(v => `<button class="chip" data-pace="${v}" aria-pressed="${+p.pace === v}">${fmt1(v)} كغ${v === 0.5 ? " (منصوح)" : ""}</button>`).join("")}</div>` : ""}`; }
  if (st === "plan") {
    const pl = planFor({ ...p, a: +p.a, h: +p.h, w: +p.w, tw: +p.tw, act: +p.act, goal: +p.goal, pace: +p.pace });
    const [bc, bcol] = bmiCat(pl.bmi);
    title = "خطتك جاهزة 🎯";
    body = `<div class="plan-hero"><span class="muted">سعراتك اليومية</span><b class="num">${fmt(pl.kcal)}</b><span class="muted">سعرة</span></div>
      <div class="stat-grid">
        <div class="stat"><small>بروتين</small><b class="num">${fmt(pl.protein)}<i>غ</i></b></div>
        <div class="stat"><small>كربوهيدرات</small><b class="num">${fmt(pl.carbs)}<i>غ</i></b></div>
        <div class="stat"><small>دهون</small><b class="num">${fmt(pl.fat)}<i>غ</i></b></div>
        <div class="stat"><small>مي</small><b class="num">${fmt1(pl.water / 1000)}<i>لتر</i></b></div></div>
      <div class="row between"><span>مؤشر كتلة الجسم</span><b class="num" style="color:${bcol}">${fmt1(pl.bmi)} · ${bc}</b></div>
      ${pl.eta ? `<div class="note">📅 إذا التزمت، بتوصل لـ <b class="num">${fmt1(+p.tw)} كغ</b> تقريباً بـ <b>${pl.eta.toLocaleDateString(LOC, { day: "numeric", month: "long", year: "numeric" })}</b></div>` : ""}
      ${pl.floored ? `<p class="muted" style="font-size:13px;margin:0">ما منحط أقل من ${fmt(pl.kcal)} سعرة لسلامتك، فممكن يطوّل الوقت شوي.</p>` : ""}
      <p class="muted" style="font-size:12px;margin:0">الأرقام تقديرية. إذا عندك حالة صحية أو حمل، استشير طبيب أو أخصائي تغذية.</p>`;
  }
  app.innerHTML = `<div class="wizard">
    <div class="wiz-top">${wiz.step > 0 ? `<button class="icon-btn" id="wz-back" aria-label="رجوع">${LANG === "en" ? "‹" : "›"}</button>` : "<span></span>"}
      <div class="wiz-bar"><i style="width:${(wiz.step + 1) / n * 100}%"></i></div><span class="muted num" style="font-size:13px">${fmt(wiz.step + 1)}/${fmt(n)}</span></div>
    <h1 class="wiz-title">${title}</h1>
    <div class="stack">${body}</div>
    <button class="btn wiz-next" id="wz-next">${st === "plan" ? "يلّا نبلّش" : "التالي"}</button></div>`;
  const inp = $("#wv"); if (inp) { inp.focus(); inp.onkeydown = e => { if (e.key === "Enter") $("#wz-next").click(); }; }
  const hint = $("#tw-hint");
  if (hint) { const upd = () => { const t = +inp.value, w = +p.w; hint.textContent = t && w ? (t < w ? "بدك تنزل " + fmt1(w - t) + " كغ" : t > w ? "بدك تزيد " + fmt1(t - w) + " كغ" : "بدك تثبّت وزنك") : ""; }; inp.oninput = upd; upd(); }
  app.querySelectorAll(".choice").forEach(b => b.onclick = () => {
    const key2 = st === "sex" ? "sex" : st === "activity" ? "act" : "goal";
    p[key2] = st === "sex" ? b.dataset.v : +b.dataset.v; renderWizard();
  });
  app.querySelectorAll("[data-pace]").forEach(b => b.onclick = () => { p.pace = +b.dataset.pace; renderWizard(); });
  const back = $("#wz-back"); if (back) back.onclick = () => { wiz.step--; renderWizard(); };
  $("#wz-next").onclick = () => {
    const v = inp ? +inp.value : null;
    const need = { age: [12, 90, "a"], height: [120, 230, "h"], weight: [30, 300, "w"], target: [30, 300, "tw"] }[st];
    if (st === "sex" && !p.sex) return toast("اختار الجنس");
    if (need) { if (!(v >= need[0] && v <= need[1])) return toast("اكتب رقم بين " + fmt(need[0]) + " و" + fmt(need[1])); p[need[2]] = v; }
    if (st === "target") p.goal = p.tw < p.w - 0.5 ? 0 : p.tw > p.w + 0.5 ? 2 : 1;
    if (st === "plan") {
      S.profile = { sex: p.sex, a: +p.a, h: +p.h, w: +p.w, tw: +p.tw, act: +p.act, goal: +p.goal, pace: +p.pace, name: p.name, done: true, since: S.profile && S.profile.since || key(new Date()) };
      if (!S.weights || !Object.keys(S.weights).length) logWeight(+p.w);
      S.goalManual = false; applyPlan(); wiz = null; tab = "today"; render(); toast("خطتك جاهزة، بالتوفيق! 💪"); return;
    }
    wiz.step++; renderWizard();
  };
}

// ===== شاشة أنا =====
function renderMe() {
  const p = prof(), pl = myPlan(), acc = getAccount() || {}, [bc, bcol] = bmiCat(pl.bmi);
  const w = curWeight(), sw = startWeight();
  const chev = LANG === "en" ? "›" : "‹";
  const row = (k, label, val) => `<button class="list-row" data-edit="${k}"><span>${label}</span><span class="muted num">${val} ${chev}</span></button>`;
  app.innerHTML = `<div class="head"><h1>أنا</h1>${supportMini()}</div>
  <div class="stack">
    <div class="card profile-card">
      <div class="avatar">${esc((p.name || acc.email || "؟").trim().charAt(0).toUpperCase())}</div>
      <div style="min-width:0"><b style="font-size:18px">${esc(p.name || "—")}</b><br><small class="muted" dir="ltr">${esc(acc.email || "")}</small></div>
      <button class="chip" id="me-sub" style="margin-inline-start:auto">${subBadge()}</button>
    </div>
    <div class="card stack" style="gap:12px">
      <div class="row between"><h2>خطتي</h2><span class="pill">${GOALS[p.goal || 0][0]}${p.goal !== 1 ? " · " + fmt1(p.pace || 0.5) + " كغ/أسبوع" : ""}</span></div>
      <div class="plan-hero"><span class="muted">سعراتك اليومية</span><b class="num">${fmt(S.goal || pl.kcal)}</b><span class="muted">${S.goalManual ? "سعرة (حطيتها بإيدك)" : "سعرة"}</span></div>
      <div class="stat-grid">
        <div class="stat"><small>بروتين</small><b class="num">${fmt(pl.protein)}<i>غ</i></b></div>
        <div class="stat"><small>كربوهيدرات</small><b class="num">${fmt(pl.carbs)}<i>غ</i></b></div>
        <div class="stat"><small>دهون</small><b class="num">${fmt(pl.fat)}<i>غ</i></b></div>
        <div class="stat"><small>مي</small><b class="num">${fmt1(pl.water / 1000)}<i>لتر</i></b></div></div>
      <div class="bmi"><div class="row between"><span>مؤشر كتلة الجسم</span><b class="num" style="color:${bcol}">${fmt1(pl.bmi)} · ${bc}</b></div>
        <div class="bmi-bar"><i style="inset-inline-start:${Math.max(0, Math.min(100, (pl.bmi - 15) / 25 * 100))}%"></i></div>
        <div class="row between muted num" style="font-size:11px"><span>١٥</span><span>١٨٫٥</span><span>٢٥</span><span>٣٠</span><span>٤٠</span></div></div>
      ${pl.eta ? `<div class="note">📅 الوصول لـ <b class="num">${fmt1(p.tw)} كغ</b> تقريباً بـ <b>${pl.eta.toLocaleDateString(LOC, { day: "numeric", month: "long", year: "numeric" })}</b></div>` : ""}
      <div class="row between muted" style="font-size:13px"><span>الحرق الأساسي ${fmt(pl.bmr)}</span><span>مع نشاطك ${fmt(pl.tdee)}</span></div>
    </div>
    <div class="card list">
      <h2 style="margin-bottom:4px">معلوماتي</h2>
      ${row("name", "الاسم", esc(p.name || "—"))}
      ${row("sex", "الجنس", p.sex === "f" ? "أنثى" : "ذكر")}
      ${row("a", "العمر", fmt(p.a) + " سنة")}
      ${row("h", "الطول", fmt(p.h) + " سم")}
      ${row("w", "الوزن الحالي", fmt1(w) + " كغ")}
      ${row("tw", "الوزن المستهدف", fmt1(p.tw || w) + " كغ")}
      ${row("act", "النشاط", ACTS[p.act || 0][0])}
      ${row("goal", "الهدف والسرعة", GOALS[p.goal || 0][0] + (p.goal !== 1 ? " · " + fmt1(p.pace || 0.5) + " كغ" : ""))}
      ${row("kcal", "السعرات اليومية", (S.goalManual ? "يدوي · " : "تلقائي · ") + fmt(S.goal))}
    </div>
    <div class="card list">
      <h2 style="margin-bottom:4px">الإعدادات</h2>
      <button class="list-row" id="me-rem"><span>🔔 التذكيرات</span><span class="muted">${S.remOn ? "شغالة" : "مطفية"} ${chev}</span></button>
      <button class="list-row" id="me-lang"><span>🌐 اللغة</span><span class="muted">${LANG === "en" ? "English" : "العربية"} ${chev}</span></button>
      <button class="list-row" id="me-subrow"><span>⭐ الاشتراك</span><span class="muted">${subBadge()} ${chev}</span></button>
      ${isAdmin() ? `<a class="list-row" href="admin.html" style="text-decoration:none;color:inherit"><span>👑 لوحة الإدارة</span><span class="muted">${chev}</span></a>` : ""}
      <button class="list-row" id="me-out" style="color:var(--tomato)"><span>تسجيل خروج</span><span>${chev}</span></button>
    </div>
    ${supportBox()}
    <p class="muted" style="text-align:center;font-size:12px;margin:0">حريره · ${esc((typeof loadedVersion !== "undefined" && loadedVersion) || "")}</p>
  </div>`;
  $("#me-sub").onclick = $("#me-subrow").onclick = () => subSheet();
  $("#me-rem").onclick = () => requirePremium("التذكيرات") && remindersSheet();
  $("#me-lang").onclick = () => setLang(LANG === "en" ? "ar" : "en");
  $("#me-out").onclick = () => { logout(); subState.active = false; refreshSub().then(render); toast("سجّلت خروج"); };
  app.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => editField(b.dataset.edit));
}
function supportMini() { return ""; }

function editField(k) {
  const p = Object.assign({}, prof());
  const done = () => { S.profile = p; applyPlan(); closeSheet(); render(); toast("انحفظ، وانحسبت خطتك من جديد"); };
  const numSheet = (title, val, unit, min, max, step, set) => sheet(`<h2>${title}</h2><div class="big-input"><input id="ef" type="number" inputmode="decimal" step="${step}" value="${val}"><span>${unit}</span></div><button class="btn" id="ef-s">احفظ</button>`, el => {
    $("#ef", el).focus();
    $("#ef-s", el).onclick = () => { const v = +$("#ef", el).value; if (!(v >= min && v <= max)) return toast("اكتب رقم بين " + fmt(min) + " و" + fmt(max)); set(v); done(); };
  });
  const listSheet = (title, items, cur, set, extra) => sheet(`<h2>${title}</h2><div class="choice-list">${items.map((x, i) => `<button class="choice row-choice ${cur === i ? "on" : ""}" data-i="${i}"><b>${x[0]}</b>${x[1] ? `<small>${x[1]}</small>` : ""}</button>`).join("")}</div>${extra || ""}`, el => {
    el.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { set(+b.dataset.i); if (!extra) done(); else { el.querySelectorAll("[data-i]").forEach(x => x.classList.toggle("on", x === b)); } });
    const s = $("#ef-s", el); if (s) s.onclick = done;
    el.querySelectorAll("[data-pace]").forEach(b => b.onclick = () => { p.pace = +b.dataset.pace; el.querySelectorAll("[data-pace]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  });
  if (k === "name") return sheet(`<h2>الاسم</h2><input id="ef" type="text" value="${esc(p.name || "")}"><button class="btn" id="ef-s">احفظ</button>`, el => { $("#ef-s", el).onclick = () => { p.name = $("#ef", el).value.trim(); done(); }; });
  if (k === "sex") return listSheet("الجنس", [["ذكر"], ["أنثى"]], p.sex === "f" ? 1 : 0, i => p.sex = i ? "f" : "m");
  if (k === "a") return numSheet("العمر", p.a, "سنة", 12, 90, 1, v => p.a = v);
  if (k === "h") return numSheet("الطول", p.h, "سم", 120, 230, 1, v => p.h = v);
  if (k === "w") return numSheet("وزنك اليوم", curWeight(), "كغ", 30, 300, 0.1, v => { logWeight(r1(v)); });
  if (k === "tw") return numSheet("الوزن المستهدف", p.tw || curWeight(), "كغ", 30, 300, 0.1, v => { p.tw = v; const w = curWeight(); p.goal = v < w - 0.5 ? 0 : v > w + 0.5 ? 2 : 1; });
  if (k === "act") return listSheet("النشاط", ACTS, p.act || 0, i => p.act = i);
  if (k === "goal") return listSheet("الهدف والسرعة", GOALS, p.goal || 0, i => p.goal = i,
    `<p class="muted" style="margin:6px 0 0">السرعة بالأسبوع:</p><div class="row" style="flex-wrap:wrap;gap:8px">${PACES.map(v => `<button class="chip" data-pace="${v}" aria-pressed="${(p.pace || 0.5) === v}">${fmt1(v)} كغ</button>`).join("")}</div><button class="btn" id="ef-s">احفظ</button>`);
  if (k === "kcal") return sheet(`<h2>السعرات اليومية</h2><p class="muted" style="margin:0">المحسوب من خطتك: <b class="num">${fmt(myPlan().kcal)}</b> سعرة. فيك تحط رقمك بإيدك إذا مدرّبك أو أخصائي التغذية عطاك رقم.</p>
    <div class="big-input"><input id="ef" type="number" inputmode="numeric" value="${S.goal}"><span>سعرة</span></div>
    <div class="row"><button class="btn" id="ef-s">احفظ رقمي</button><button class="btn ghost" id="ef-auto">رجّعها تلقائي</button></div>`, el => {
    $("#ef-s", el).onclick = () => { const v = Math.round(+$("#ef", el).value); if (!(v >= 800 && v <= 6000)) return toast("اكتب رقم بين ٨٠٠ و٦٠٠٠"); S.goal = v; S.goalManual = true; save(); closeSheet(); render(); };
    $("#ef-auto", el).onclick = () => { S.goalManual = false; applyPlan(); closeSheet(); render(); toast("رجعت السعرات تلقائية"); };
  });
}
