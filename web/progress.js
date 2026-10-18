// قسم التقدّم: الوزن مع الهدف، القياسات ونسبة الدهون، معدلات الأسبوع، الأيام المتتالية والإنجازات
function loggedDay(k) { return ((S.days || {})[k] || []).length > 0 || ((S.ex || {})[k] || []).length > 0; }
function streak() {
  let n = 0; const d = new Date();
  if (!loggedDay(key(d))) d.setDate(d.getDate() - 1); // اليوم لسا ما خلص
  while (loggedDay(key(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
// نسبة الدهون (طريقة البحرية الأمريكية) من الخصر والرقبة (والورك للنساء)
function bodyFat(m, p) {
  if (!m || !m.waist || !m.neck || !p.h) return null;
  const lg = Math.log10;
  if (p.sex === "f") { if (!m.hip) return null; return 495 / (1.29579 - 0.35004 * lg(m.waist + m.hip - m.neck) + 0.221 * lg(p.h)) - 450; }
  return 495 / (1.0324 - 0.19077 * lg(m.waist - m.neck) + 0.15456 * lg(p.h)) - 450;
}
const MEASURES = [["waist", "الخصر"], ["hip", "الورك"], ["chest", "الصدر"], ["arm", "الزند"], ["thigh", "الفخد"], ["neck", "الرقبة"]];
function latestMeasures() { const m = S.meas || {}, ks = Object.keys(m).sort(); const out = {}; ks.forEach(k => Object.assign(out, m[k])); return { cur: out, first: ks.length ? m[ks[0]] : {} }; }

const BADGES = [
  ["first", "🍽️", "أول وجبة", "سجّلت أول أكلة"],
  ["s3", "🔥", "٣ أيام ورا بعض", "سجّلت ٣ أيام متتالية"],
  ["s7", "⚡", "أسبوع كامل", "٧ أيام متتالية"],
  ["s30", "👑", "شهر التزام", "٣٠ يوم متتالي"],
  ["w1", "🏃", "أول تمرين", "خلّصت أول تمرين"],
  ["w10", "💪", "١٠ تمارين", "خلّصت ١٠ تمارين"],
  ["k1", "📉", "أول كيلو", "نزلت أول كيلو"],
  ["k5", "🏅", "٥ كيلو", "نزلت ٥ كيلو"],
  ["water7", "💧", "مي ٧ أيام", "وصلت لهدف المي ٧ أيام"],
  ["photo", "📸", "مصوّر", "سجّلت أكلة من صورة"],
];
function earnedBadges() {
  const all = Object.values(S.days || {}).flat(), ex = Object.values(S.ex || {}).flat();
  const lost = startWeight() - curWeight(), st = streak();
  const cups = S.waterMl ? Math.round(S.waterMl / 250) : 8;
  const waterDays = Object.values(S.water || {}).filter(n => n >= cups).length;
  const best = Math.max(st, S.bestStreak || 0); if (best > (S.bestStreak || 0)) { S.bestStreak = best; save(); }
  return { first: all.length > 0, s3: best >= 3, s7: best >= 7, s30: best >= 30, w1: ex.length > 0, w10: ex.length >= 10, k1: lost >= 1, k5: lost >= 5, water7: waterDays >= 7, photo: all.some(e => e.src) };
}

function renderProgress() {
  const p = prof(), w = curWeight(), sw = startWeight(), tw = p.tw || w;
  const total = Math.abs(sw - tw) || 1, doneKg = p.goal === 2 ? w - sw : sw - w;
  const pct = Math.max(0, Math.min(100, doneKg / total * 100));
  const wk = Object.entries(S.weights || {}).sort(([a], [b]) => a < b ? -1 : 1);
  const range = S.wRange || 90;
  const from = key(new Date(Date.now() - range * 864e5));
  const pts = wk.filter(([k]) => k >= from);
  // معدلات آخر ٧ أيام
  let kcal = 0, kDays = 0, water = 0, burned = 0;
  for (let i = 0; i < 7; i++) { const k = key(new Date(Date.now() - i * 864e5)); const l = (S.days || {})[k] || []; if (l.length) { kcal += l.reduce((a, e) => a + e.k, 0); kDays++; } water += (S.water || {})[k] || 0; burned += ((S.ex || {})[k] || []).reduce((a, e) => a + e.k, 0); }
  const { cur: m, first: m0 } = latestMeasures(), bf = bodyFat(m, p), pl = myPlan(), [bc, bcol] = bmiCat(pl.bmi);
  const earned = earnedBadges();
  app.innerHTML = `<div class="head"><h1>التقدّم</h1><button class="chip" id="pg-w">+ سجّل وزن</button></div>
  <div class="stack">
    <div class="card stack" style="gap:10px">
      <div class="row between"><div><small class="muted">وزنك هلق</small><div class="big-num num">${fmt1(w)}<i> كغ</i></div></div>
        <div style="text-align:end"><small class="muted">${p.goal === 2 ? "زدت" : "نزلت"}</small><div class="num" style="font-size:22px;font-weight:700;color:${doneKg >= 0 ? "var(--herb)" : "var(--tomato)"}">${doneKg >= 0 ? "" : "+"}${fmt1(Math.abs(doneKg))} كغ</div></div></div>
      <div class="prog-bar"><i style="width:${pct}%"></i></div>
      <div class="row between muted num" style="font-size:12px"><span>البداية ${fmt1(sw)}</span><span>${fmt(pct)}٪</span><span>الهدف ${fmt1(tw)}</span></div>
      <div class="row" style="gap:6px">${[[30, "شهر"], [90, "٣ أشهر"], [365, "سنة"]].map(([d, l]) => `<button class="chip" data-range="${d}" aria-pressed="${range === d}">${l}</button>`).join("")}</div>
      ${weightChart(pts, tw)}
    </div>
    <div class="stat-grid">
      <div class="stat"><small>مؤشر الكتلة</small><b class="num" style="color:${bcol}">${fmt1(pl.bmi)}</b><small style="color:${bcol}">${bc}</small></div>
      <div class="stat"><small>نسبة الدهون</small><b class="num">${bf ? fmt1(bf) + "<i>٪</i>" : "—"}</b><small class="muted">${bf ? "تقديرية" : "سجّل الخصر والرقبة"}</small></div>
      <div class="stat"><small>أيام متتالية</small><b class="num">${fmt(streak())}<i>🔥</i></b><small class="muted">أفضل: ${fmt(S.bestStreak || streak())}</small></div>
      <div class="stat"><small>تمارين بالكل</small><b class="num">${fmt(Object.values(S.ex || {}).flat().length)}</b><small class="muted">حرق ${fmt(Object.values(S.ex || {}).flat().reduce((a, e) => a + e.k, 0))}</small></div>
    </div>
    <div class="card stack" style="gap:8px"><h2>معدّلات الأسبوع</h2>
      <div class="row between"><span>معدّل السعرات</span><b class="num">${kDays ? fmt(kcal / kDays) : "—"} <small class="muted">/ ${fmt(S.goal || pl.kcal)}</small></b></div>
      <div class="row between"><span>معدّل المي</span><b class="num">${fmt1(water / 7)} <small class="muted">كاسة/يوم</small></b></div>
      <div class="row between"><span>حرق الرياضة</span><b class="num">${fmt(burned)} <small class="muted">سعرة</small></b></div>
      <div class="row between"><span>أيام سجّلت فيها</span><b class="num">${fmt(kDays)}/٧</b></div></div>
    ${reportCard()}
    ${weekCard()}
    <div class="card stack" style="gap:8px"><div class="row between"><h2>قياسات الجسم</h2><button class="chip" id="pg-m">+ قياس</button></div>
      ${Object.keys(m).length ? `<div class="meas-grid">${MEASURES.filter(([k]) => m[k]).map(([k, l]) => { const d = m0[k] ? m[k] - m0[k] : 0; return `<div><small class="muted">${l}</small><b class="num">${fmt1(m[k])}<i> سم</i></b>${d ? `<small class="num" style="color:${d < 0 ? "var(--herb)" : "var(--tomato)"}">${d > 0 ? "+" : ""}${fmt1(d)}</small>` : ""}</div>`; }).join("")}</div>`
        : `<small class="muted">القياسات بتبيّن التقدّم حتى لو الميزان ما تحرّك. قيس الخصر عند السرة، والرقبة تحت تفاحة آدم.</small>`}</div>
    <div class="card stack" style="gap:8px"><h2>الإنجازات <small class="muted num">${fmt(Object.values(earned).filter(Boolean).length)}/${fmt(BADGES.length)}</small></h2>
      <div class="badge-grid">${BADGES.map(([id, ic, n, d]) => `<div class="badge ${earned[id] ? "on" : ""}" title="${d}"><span>${ic}</span><b>${n}</b><small>${d}</small></div>`).join("")}</div></div>
  </div>`;
  $("#pg-w").onclick = weightSheet;
  $("#pg-m").onclick = measureSheet;
  app.querySelectorAll("[data-range]").forEach(b => b.onclick = () => { S.wRange = +b.dataset.range; save(); render(); });
}
function weightChart(pts, tw) {
  if (pts.length < 2) return `<small class="muted">سجّل وزنك كل أسبوع بنفس الوقت (الصبح قبل الأكل) ليبيّن الرسم.</small>`;
  const vals = pts.map(x => x[1]), lo = Math.min(...vals, tw) - 1, hi = Math.max(...vals, tw) + 1, W = 320, H = 130;
  const t0 = new Date(pts[0][0]).getTime(), t1 = new Date(pts[pts.length - 1][0]).getTime() || t0 + 1;
  const X = k => { const x = (new Date(k).getTime() - t0) / ((t1 - t0) || 1) * W; return LANG === "en" ? x : W - x; };
  const Y = v => H - (v - lo) / (hi - lo) * H;
  const line = pts.map(([k, v]) => `${X(k).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const area = `${X(pts[0][0])},${H} ${line} ${X(pts[pts.length - 1][0])},${H}`;
  const last = pts[pts.length - 1];
  return `<svg viewBox="-8 -10 ${W + 16} ${H + 28}" style="width:100%" role="img" aria-label="الوزن مع الوقت">
    <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--herb)" stop-opacity=".25"/><stop offset="1" stop-color="var(--herb)" stop-opacity="0"/></linearGradient></defs>
    ${[0.25, 0.5, 0.75].map(f => `<line x1="0" x2="${W}" y1="${H * f}" y2="${H * f}" stroke="var(--line)" stroke-width="1"/>`).join("")}
    <line x1="0" x2="${W}" y1="${Y(tw)}" y2="${Y(tw)}" stroke="var(--saffron)" stroke-dasharray="5 4" stroke-width="1.5"/>
    <text x="${LANG === "en" ? W : 0}" y="${Y(tw) - 5}" font-size="10" fill="var(--saffron)" text-anchor="${LANG === "en" ? "end" : "start"}">الهدف ${fmt1(tw)}</text>
    <polygon points="${area}" fill="url(#wg)"/>
    <polyline points="${line}" fill="none" stroke="var(--herb)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${X(last[0])}" cy="${Y(last[1])}" r="4.5" fill="var(--herb)" stroke="var(--card)" stroke-width="2"/>
    <text x="${X(pts[0][0])}" y="${H + 16}" font-size="10" fill="var(--muted)" text-anchor="middle">${new Date(pts[0][0]).toLocaleDateString(LOC, { day: "numeric", month: "short" })}</text>
    <text x="${X(last[0])}" y="${H + 16}" font-size="10" fill="var(--muted)" text-anchor="middle">${new Date(last[0]).toLocaleDateString(LOC, { day: "numeric", month: "short" })}</text></svg>`;
}
function measureSheet() {
  const { cur } = latestMeasures(), p = prof();
  sheet(`<h2>قياسات اليوم</h2><small class="muted">بالسنتيمتر. عبّي اللي بدك ياه بس.</small>
    <div class="meas-form">${MEASURES.map(([k, l]) => `<label><span>${l}${(k === "neck" || k === "waist" || (k === "hip" && p.sex === "f")) ? " *" : ""}</span><input id="ms-${k}" type="number" inputmode="decimal" step="0.5" placeholder="${cur[k] ? fmt1(cur[k]) : ""}"></label>`).join("")}</div>
    <small class="muted">* لحساب نسبة الدهون.</small><button class="btn" id="ms-s">احفظ</button>`, el => {
    $("#ms-s", el).onclick = () => {
      const o = {}; MEASURES.forEach(([k]) => { const v = +$("#ms-" + k, el).value; if (v >= 10 && v <= 250) o[k] = v; });
      if (!Object.keys(o).length) return toast("اكتب قياس واحد على الأقل");
      S.meas = S.meas || {}; S.meas[key(new Date())] = Object.assign(S.meas[key(new Date())] || {}, o); save(); closeSheet(); render(); toast("انحفظت القياسات");
    };
  });
}
