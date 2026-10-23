// التقرير الأسبوعي + تنبيه قبل ما يخلص الاشتراك
const DAY_MS = 864e5;

// ===== إحصائيات ٧ أيام (آخر يوم = end) =====
function weekStats(end) {
  const ds = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(end); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i); ds.push(d); }
  const goal = S.goal || 2000, tg = S.macros || { p: goal * .25 / 4 };
  const rows = ds.map(d => {
    const k = key(d), l = (S.days || {})[k] || [];
    return { d, k, n: l.length, kc: l.reduce((a, e) => a + (e.k || 0), 0), p: l.reduce((a, e) => a + (e.p || 0), 0),
      burn: ((S.ex || {})[k] || []).reduce((a, e) => a + (e.k || 0), 0), water: (S.water || {})[k] || 0 };
  });
  const logged = rows.filter(r => r.n);
  const tgt = r => goal + r.burn;
  const onTarget = logged.filter(r => r.kc <= tgt(r) * 1.05 && r.kc >= tgt(r) * 0.7).length;
  const best = logged.length ? logged.reduce((b, r) => Math.abs(r.kc - tgt(r)) < Math.abs(b.kc - tgt(b)) ? r : b) : null;
  const w = Object.entries(S.weights || {}).sort(([a], [b]) => a < b ? -1 : 1);
  const k0 = rows[0].k, k1 = rows[6].k;
  const before = w.filter(([k]) => k < k0).pop(), inW = w.filter(([k]) => k >= k0 && k <= k1);
  const w0 = before ? before[1] : inW.length > 1 ? inW[0][1] : null, w1 = inW.length ? inW[inW.length - 1][1] : null;
  return {
    rows, logged: logged.length, goal, onTarget, best,
    avg: logged.length ? logged.reduce((a, r) => a + r.kc, 0) / logged.length : 0,
    protein: logged.length ? logged.reduce((a, r) => a + r.p, 0) / logged.length : 0, proteinGoal: tg.p,
    burn: rows.reduce((a, r) => a + r.burn, 0), exDays: rows.filter(r => r.burn > 0).length,
    water: rows.reduce((a, r) => a + r.water, 0) / 7,
    dw: w0 != null && w1 != null ? w1 - w0 : null, w1,
  };
}
// علامة الأسبوع من ١٠٠: الالتزام بالسعرات + التسجيل + الرياضة + المي
function weekScore(s) {
  const waterGoal = S.waterMl ? S.waterMl / 250 : 8;
  return Math.round(s.onTarget / 7 * 45 + s.logged / 7 * 25 + Math.min(s.exDays, 4) / 4 * 15 + Math.min(s.water / waterGoal, 1) * 15);
}
function weekVerdict(s, sc) {
  const g = prof().goal, dw = s.dw;
  if (!s.logged) return ["📝", "ما سجّلت شي هالأسبوع", "سجّل أكلك ولو يومين بالأسبوع الجاي لنقدر نعطيك تقرير حقيقي."];
  let t = sc >= 80 ? ["🏆", "أسبوع بطل!", "التزامك ممتاز، كمّل هيك والنتيجة رح تبين."] : sc >= 60 ? ["💪", "أسبوع منيح", "ماشي بالطريق الصح، شوية التزام زيادة وبتوصل أسرع."] : sc >= 35 ? ["🙂", "بداية منيحة", "حاول تسجّل كل يوم وتقرّب من هدفك اليومي."] : ["🌱", "كل أسبوع فرصة جديدة", "ابدأ بخطوة صغيرة: سجّل فطورك كل يوم هالأسبوع."];
  if (dw != null && Math.abs(dw) >= 0.1) {
    const good = g === 2 ? dw > 0 : g === 1 ? Math.abs(dw) < 0.5 : dw < 0;
    if (good && g !== 1) t = [t[0], t[1], (dw < 0 ? "نزلت " : "زدت ") + fmt1(Math.abs(dw)) + " كغ هالأسبوع 👏 " + t[2]];
  }
  return t;
}
function reportCard() {
  if (!isPremium()) return "";
  const s = weekStats(new Date());
  if (!s.logged) return "";
  const fri = new Date().getDay() === 5, seen = S.repSeen === key(new Date());
  const sc = weekScore(s);
  return `<button class="card list-row" id="rep-open" style="width:100%;text-align:start;cursor:pointer;${fri && !seen ? "border-color:var(--saffron);background:var(--saffron-soft, var(--card))" : ""}">
    <span class="row" style="gap:12px"><span class="score-ring num" style="--v:${sc}">${fmt(sc)}</span>
    <span><b>${fri && !seen ? "📊 تقريرك الأسبوعي جاهز" : "📊 تقرير الأسبوع"}</b><small class="muted" style="display:block">${fmt(s.onTarget)}/٧ أيام ضمن هدفك${s.dw != null && Math.abs(s.dw) >= 0.1 ? " · " + (s.dw < 0 ? "−" : "+") + fmt1(Math.abs(s.dw)) + " كغ" : ""}</small></span></span>
    <span class="muted">${LANG === "en" ? "›" : "‹"}</span></button>`;
}
function reportSheet(offset) {
  offset = offset || 0;
  const end = new Date(); end.setDate(end.getDate() - offset * 7);
  const s = weekStats(end), sc = weekScore(s), [ic, title, msg] = weekVerdict(s, sc), p = prof();
  const prev = weekStats(new Date(end.getTime() - 7 * DAY_MS)), psc = weekScore(prev);
  const from = s.rows[0].d.toLocaleDateString(LOC, { day: "numeric", month: "short" }), to = s.rows[6].d.toLocaleDateString(LOC, { day: "numeric", month: "short" });
  const max = Math.max(s.goal * 1.3, ...s.rows.map(r => r.kc));
  const bars = s.rows.map(r => `<div class="rb"><i style="height:${Math.max(r.kc ? 4 : 0, r.kc / max * 100)}%;background:${!r.n ? "var(--line)" : r.kc > s.goal + r.burn ? "var(--tomato)" : "var(--herb)"}"></i><small>${r.d.toLocaleDateString(LOC, { weekday: "narrow" })}</small></div>`).join("");
  const goalLine = s.goal / max * 100;
  const tips = [];
  if (s.logged < 5) tips.push("سجّل أكلك كل يوم، حتى الأيام اللي بتاكل فيها برّا.");
  if (s.avg > s.goal * 1.08) tips.push("معدّل سعراتك أعلى من هدفك بـ " + fmt(s.avg - s.goal) + " سعرة. جرّب تخفف النشويات أو العصائر.");
  if (s.protein && s.proteinGoal && s.protein < s.proteinGoal * 0.75) tips.push("البروتين قليل (" + fmt(s.protein) + " من " + fmt(s.proteinGoal) + " غ). زيد بيض، دجاج، لبن، عدس.");
  if (s.exDays < 3) tips.push("حاول تتمرّن ٣ أيام على الأقل، حتى لو مشي نص ساعة.");
  if (s.water < 6) tips.push("المي قليلة (" + fmt1(s.water) + " كاسة باليوم). خلّي قنينة جنبك.");
  if (!tips.length) tips.push("كل شي ماشي ممتاز، بس لا تنسى تسجّل وزنك مرة بالأسبوع.");
  const stat = (lbl, v, sub) => `<div class="stat"><small>${lbl}</small><b class="num">${v}</b>${sub ? `<small class="muted">${sub}</small>` : ""}</div>`;
  sheet(`<div class="row between"><h2>تقرير الأسبوع</h2><small class="muted num">${from} – ${to}</small></div>
    <div class="row" style="gap:14px;align-items:center"><span class="score-ring big num" style="--v:${sc}">${fmt(sc)}</span>
      <div style="min-width:0"><b style="font-size:18px">${ic} ${title}</b><p class="muted" style="margin:4px 0 0">${msg}</p>
      ${prev.logged ? `<small class="num" style="color:${sc >= psc ? "var(--herb)" : "var(--tomato)"}">${sc >= psc ? "▲" : "▼"} ${fmt(Math.abs(sc - psc))} عن الأسبوع اللي قبله</small>` : ""}</div></div>
    <div class="rbars" style="--g:${goalLine.toFixed(1)}">${bars}</div>
    <div class="stat-grid">
      ${stat("معدّل السعرات", fmt(s.avg), "من " + fmt(s.goal))}
      ${stat("أيام ضمن الهدف", fmt(s.onTarget) + "<i>/٧</i>", "سجّلت " + fmt(s.logged) + " أيام")}
      ${stat("الوزن", s.dw != null ? (s.dw <= 0 ? "−" : "+") + fmt1(Math.abs(s.dw)) + "<i> كغ</i>" : s.w1 ? fmt1(s.w1) + "<i> كغ</i>" : "—", s.dw != null ? "هالأسبوع" : "سجّل وزنك لنقارن")}
      ${stat("الرياضة", fmt(s.exDays) + "<i> أيام</i>", "حرقت " + fmt(s.burn))}
      ${stat("البروتين", fmt(s.protein) + "<i>غ</i>", "باليوم · هدفك " + fmt(s.proteinGoal))}
      ${stat("المي", fmt1(s.water) + "<i> كاسة</i>", "باليوم")}
    </div>
    ${s.best ? `<div class="note">⭐ أحسن يوم: <b>${s.best.d.toLocaleDateString(LOC, { weekday: "long" })}</b> (${fmt(s.best.kc)} سعرة)</div>` : ""}
    <b>نصائح للأسبوع الجاي</b><ul style="margin:0;padding-inline-start:20px;line-height:1.9">${tips.slice(0, 3).map(t => `<li>${t}</li>`).join("")}</ul>
    <div class="row between"><button class="chip" id="rep-prev">${LANG === "en" ? "‹" : "›"} الأسبوع اللي قبله</button>${offset ? `<button class="chip" id="rep-next">الأسبوع اللي بعده ${LANG === "en" ? "›" : "‹"}</button>` : ""}</div>
    <button class="btn" id="rep-share">📤 شارك تقريرك</button>`, el => {
    $("#rep-prev", el).onclick = () => { closeSheet(); setTimeout(() => reportSheet(offset + 1), 50); };
    const nx = $("#rep-next", el); if (nx) nx.onclick = () => { closeSheet(); setTimeout(() => reportSheet(offset - 1), 50); };
    $("#rep-share", el).onclick = () => {
      const txt = `📊 أسبوعي مع حريره: ${fmt(sc)}/١٠٠\n${ic} ${title}\n• ${fmt(s.onTarget)}/٧ أيام ضمن هدفي\n• معدّل ${fmt(s.avg)} سعرة باليوم${s.dw != null && Math.abs(s.dw) >= 0.1 ? `\n• ${s.dw < 0 ? "نزلت" : "زدت"} ${fmt1(Math.abs(s.dw))} كغ` : ""}\n• ${fmt(s.exDays)} أيام رياضة`;
      if (navigator.share) navigator.share({ text: txt }).catch(() => {}); else navigator.clipboard.writeText(txt).then(() => toast("انسخ، الصقه وين ما بدك"), () => {});
    };
  });
  if (!offset) { S.repSeen = key(new Date()); save(); }
}

// ===== تنبيه انتهاء الاشتراك/التجربة =====
function daysLeftSub() { return subState.active && subState.exp ? Math.ceil((subState.exp - Date.now()) / DAY_MS) : null; }
const renewDue = () => { const d = daysLeftSub(); return d != null && d <= 3; };
function renewBanner() {
  if (isAdmin()) return "";
  const d = daysLeftSub(), req = typeof getReq === "function" ? getReq() : null;
  if (req && req.status === "pending") return "";
  if (d != null && d <= 3) {
    const when = d <= 0 ? "اليوم" : d === 1 ? "بكرا" : d === 2 ? "بعد يومين" : "بعد " + fmt(d) + " أيام";
    return `<div class="note row between" style="gap:8px;margin-bottom:12px;background:var(--tomato-soft, var(--card))"><span>⏳ اشتراكك بيخلص <b>${when}</b>. جدّد هلق وما بيوقف شي.</span><button class="chip" id="renew-go" style="background:var(--tomato);border-color:var(--tomato);color:#fff">جدّد</button></div>`;
  }
  if (!subState.active && inTrial() && subState.trialEnds - Date.now() < DAY_MS) {
    return `<div class="note row between" style="gap:8px;margin-bottom:12px"><span>⏳ تجربتك المجانية بتخلص <b>اليوم</b>. اشترك لتكمّل بكل الميزات.</span><button class="chip" id="renew-go">اشترك</button></div>`;
  }
  return "";
}
document.addEventListener("click", e => { if (e.target.closest && e.target.closest("#renew-go")) subSheet(); if (e.target.closest && e.target.closest("#rep-open")) reportSheet(0); });

// إشعارات: قبل ٣ أيام ويوم ويوم الانتهاء، وتقرير كل جمعة
function extraReminders() {
  const out = [], en = LANG === "en", now = Date.now();
  const at = (d, h) => { const x = new Date(d); x.setHours(h, 0, 0, 0); return x.getTime(); };
  if (subState.active && subState.exp) {
    [[3, en ? "Your subscription ends in 3 days" : "اشتراكك بيخلص بعد ٣ أيام"], [1, en ? "Your subscription ends tomorrow" : "اشتراكك بيخلص بكرا"], [0, en ? "Your subscription ends today" : "اشتراكك بيخلص اليوم"]].forEach(([n, title]) => {
      const t = at(subState.exp - n * DAY_MS, 11);
      if (t > now) out.push({ id: "sub" + n, at: t, title: "⏳ " + title, body: en ? "Renew now so nothing stops." : "جدّد هلق من التطبيق وما بيوقف شي." });
    });
  }
  if (isPremium()) for (let i = 0; i < 10; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    if (d.getDay() === 5) { const t = at(d, 12); if (t > now) out.push({ id: "rep" + key(d), at: t, title: en ? "Your weekly report is ready 📊" : "تقريرك الأسبوعي جاهز 📊", body: en ? "See how your week went." : "شوف شلون كان أسبوعك وشو بتحسّن." }); }
  }
  return out;
}
