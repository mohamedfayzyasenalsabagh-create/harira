// قسم التمارين: مكتبة تمارين، برامج جاهزة، ومدرّب بيمشي معك تمرين تمرين بالوقت والراحة
// [المعرّف, الاسم, العضلة, MET, الشرح]
const EXS = {
  jj: ["قفز فتح وسكّر", "كامل الجسم", 8, "اقفز وافتح إجريك وارفع إيديك فوق راسك، بعدين ارجع لوضع البداية. خلّي ظهرك مستقيم."],
  march: ["مشي بالمكان", "كارديو", 3.5, "ارفع ركبك بالتناوب وحرّك إيديك متل المشي. بسرعة مريحة."],
  hk: ["رفع ركب سريع", "كارديو", 8, "اركض بالمكان وارفع ركبك لمستوى خصرك قد ما فيك."],
  squat: ["سكوات", "الأرجل والمؤخرة", 5, "افتح إجريك بعرض كتافك، انزل كأنك عم تقعد على كرسي لحد ما فخادك يصيروا موازيين للأرض، ركبك ما بتتعدى أصابعك."],
  jsquat: ["سكوات مع قفزة", "الأرجل", 8, "انزل سكوات وبعدين اقفز لفوق بقوة، وانزل بنعومة على مقدمة رجليك."],
  lunge: ["طعنات", "الأرجل والمؤخرة", 5, "خطوة لقدام وانزل لحد ما ركبتك الخلفية تقرب من الأرض، ارجع وبدّل الرجل."],
  bridge: ["رفع الحوض", "المؤخرة والظهر", 3.5, "استلقي على ظهرك وركبك مثنية، ارفع حوضك لفوق واعصر عضلات المؤخرة، انزل ببطء."],
  kpush: ["ضغط على الركب", "الصدر والذراعين", 3.8, "متل الضغط العادي بس ركبك على الأرض. جسمك خط مستقيم من الراس للركب."],
  push: ["ضغط", "الصدر والذراعين", 8, "إيديك أعرض من كتافك شوي، انزل بصدرك لقرب الأرض وارجع. البطن مشدود."],
  plank: ["بلانك", "البطن", 4, "استند على كوعك ومقدمة رجليك، جسمك خط مستقيم، شد بطنك وما تنزّل حوضك."],
  splank: ["بلانك جانبي", "الخواصر", 4, "استند على كوع واحد وجنب رجلك، ارفع حوضك وخلّي جسمك مستقيم. بدّل الجهة بنص الوقت."],
  crunch: ["كرانش", "البطن", 3.8, "استلقي وركبك مثنية، ارفع كتافك عن الأرض بعضلات البطن، بدون ما تشد رقبتك."],
  bike: ["كرانش دراجة", "البطن والخواصر", 4.5, "قرّب كوعك من الركبة المعاكسة بالتناوب متل حركة الدراجة."],
  legraise: ["رفع الأرجل", "أسفل البطن", 4, "استلقي على ظهرك وإيديك تحت حوضك، ارفع رجليك مستقيمين لفوق ونزّلهم ببطء بدون ما يلمسوا الأرض."],
  twist: ["لف روسي", "الخواصر", 4.5, "اقعد ومِل لورا شوي ورجليك مرفوعين أو على الأرض، لف جذعك يمين ويسار."],
  climber: ["متسلق الجبل", "كامل الجسم", 8, "من وضعية الضغط، قرّب ركبك من صدرك بالتناوب وبسرعة."],
  burpee: ["بيربي", "كامل الجسم", 10, "انزل قرفصاء، ارمي رجليك لورا لوضعية الضغط، ارجع واقفز لفوق."],
  skater: ["قفز جانبي", "الأرجل والتوازن", 7, "اقفز من رجل لرجل للجنب متل المتزلج، والإيد المعاكسة لقدام."],
  pjack: ["بلانك مع قفز", "البطن والكارديو", 8, "من وضعية البلانك على إيديك، افتح وسكّر رجليك بقفزة."],
  superman: ["سوبرمان", "أسفل الظهر", 3.5, "استلقي على بطنك وارفع إيديك ورجليك سوا عن الأرض، اثبت ثانيتين ونزّل."],
  wallsit: ["قعدة الحيط", "الأرجل", 4, "سند ظهرك عالحيط وانزل لحد ما فخادك يصيروا موازيين للأرض، واثبت."],
  dips: ["غطس على كرسي", "الترايسبس", 4, "إيديك على طرف كرسي ثابت، انزل بثني كوعك وارجع لفوق."],
  stretch: ["تمدد وتهدئة", "مرونة", 2.3, "مدّد الأرجل والظهر والكتاف بهدوء، وتنفّس بعمق."],
  walk: ["مشي سريع", "كارديو", 4.3, "امشي بخطوة سريعة بحيث تقدر تحكي بس بصعوبة شوي."],
  // جيم
  gsquat: ["سكوات بالدمبل", "الأرجل", 5, "مسك دمبل قدام صدرك وانزل سكوات وظهرك مستقيم."],
  legpress: ["مكبس الأرجل", "الأرجل", 5, "رجليك بعرض الكتاف على اللوح، انزل لحد ٩٠ درجة وادفع بدون ما تقفل ركبك."],
  latpull: ["سحب ظهر عالي", "الظهر", 5, "اسحب البار لأعلى صدرك وصدرك لقدام، ورجّعه ببطء."],
  row: ["سحب أرضي", "الظهر", 5, "اسحب المقبض لبطنك وقرّب لوحي كتافك من بعض."],
  chest: ["ضغط صدر بالجهاز", "الصدر", 5, "ادفع المقابض لقدام بدون ما تقفل كوعك، ورجّع ببطء."],
  bench: ["بنش بالدمبل", "الصدر", 5, "استلقي على البنش، ادفع الدمبلات لفوق ونزّلهم لمستوى صدرك."],
  shoulder: ["ضغط أكتاف", "الأكتاف", 5, "ادفع الدمبلات من مستوى أذنيك لفوق راسك."],
  curl: ["بايسبس دمبل", "البايسبس", 4, "اثني كوعك وارفع الدمبل بدون ما تحرّك كتفك."],
  tricep: ["ترايسبس كيبل", "الترايسبس", 4, "اسحب الحبل لتحت لحد ما إيديك يستقيموا، والكوع ثابت جنبك."],
  rdl: ["رفعة رومانية", "الخلفية والمؤخرة", 5, "انزل بالدمبلات قدام رجليك وظهرك مستقيم وركبك مثنية شوي، بعدين ارجع واعصر المؤخرة."],
  legcurl: ["ثني الأرجل", "الخلفية", 4, "اثني رجليك بالجهاز لحد آخر المدى ورجّع ببطء."],
  calf: ["سمانة", "السمانة", 3.5, "اطلع على مقدمة رجليك لفوق، اثبت ثانية ونزّل ببطء."],
  treadmill: ["مشي على المشاية بميلان", "كارديو", 6, "سرعة ٥-٦ كم/ساعة مع ميلان ٨-١٢٪."],
};
// برنامج: أيام، كل يوم قائمة [تمرين, تكرارات أو ثواني, نوع r/s, جولات]، والراحة
const PROGRAMS = [
  { id: "home-start", name: "تنحيف بالبيت · مبتدئ", tag: "بدون أدوات", level: "مبتدئ", weeks: 4, perWeek: 3, rest: 30, icon: "🏠",
    desc: "دارة تمارين خفيفة لكامل الجسم، ٢٠-٢٥ دقيقة. مثالي لتبلّش.",
    days: [[["march", 60, "s"], ["jj", 30, "s"], ["squat", 12, "r"], ["kpush", 8, "r"], ["bridge", 12, "r"], ["plank", 20, "s"], ["crunch", 12, "r"], ["stretch", 120, "s"]]], rounds: 3 },
  { id: "hiit", name: "حرق دهون HIIT", tag: "بدون أدوات", level: "متوسط", weeks: 4, perWeek: 3, rest: 20, icon: "🔥",
    desc: "٤٠ ثانية شغل و٢٠ راحة. حرق عالي بوقت قصير.",
    days: [[["jj", 40, "s"], ["burpee", 40, "s"], ["climber", 40, "s"], ["jsquat", 40, "s"], ["hk", 40, "s"], ["skater", 40, "s"], ["pjack", 40, "s"]]], rounds: 4 },
  { id: "abs", name: "شد البطن والخصر", tag: "بدون أدوات", level: "كل المستويات", weeks: 4, perWeek: 4, rest: 20, icon: "🎯",
    desc: "تمارين مركّزة للبطن والخواصر وأسفل الظهر، ١٥ دقيقة.",
    days: [[["crunch", 15, "r"], ["bike", 20, "r"], ["legraise", 12, "r"], ["twist", 20, "r"], ["plank", 40, "s"], ["splank", 40, "s"], ["superman", 12, "r"]]], rounds: 3 },
  { id: "lower", name: "أرجل ومؤخرة بالبيت", tag: "بدون أدوات", level: "مبتدئ/متوسط", weeks: 4, perWeek: 3, rest: 30, icon: "🍑",
    desc: "تقوية وشد الأرجل والمؤخرة.",
    days: [[["squat", 15, "r"], ["lunge", 12, "r"], ["bridge", 15, "r"], ["wallsit", 40, "s"], ["jsquat", 10, "r"], ["calf", 20, "r"]]], rounds: 3 },
  { id: "gym-full", name: "جيم · جسم كامل للمبتدئين", tag: "جيم", level: "مبتدئ", weeks: 6, perWeek: 3, rest: 75, icon: "🏋️",
    desc: "يومين متبادلين (أ وب)، ٣ جولات لكل تمرين.",
    days: [[["gsquat", 12, "r"], ["latpull", 12, "r"], ["chest", 12, "r"], ["rdl", 10, "r"], ["shoulder", 10, "r"], ["plank", 40, "s"]],
           [["legpress", 12, "r"], ["row", 12, "r"], ["bench", 10, "r"], ["legcurl", 12, "r"], ["curl", 12, "r"], ["tricep", 12, "r"]]], rounds: 3 },
  { id: "gym-split", name: "جيم · علوي وسفلي ٤ أيام", tag: "جيم", level: "متوسط", weeks: 8, perWeek: 4, rest: 90, icon: "💪",
    desc: "تقسيم كلاسيكي لبناء العضل وشد الجسم.",
    days: [[["bench", 10, "r"], ["row", 10, "r"], ["shoulder", 10, "r"], ["latpull", 12, "r"], ["curl", 12, "r"], ["tricep", 12, "r"]],
           [["gsquat", 10, "r"], ["rdl", 10, "r"], ["legpress", 12, "r"], ["legcurl", 12, "r"], ["calf", 15, "r"], ["plank", 45, "s"]]], rounds: 3 },
  { id: "walk", name: "مشي للتنحيف", tag: "برّا", level: "كل المستويات", weeks: 4, perWeek: 5, rest: 0, icon: "🚶",
    desc: "مشي سريع ٣٠-٤٥ دقيقة. أسهل طريقة لتحرق بدون ضغط على المفاصل.",
    days: [[["walk", 1800, "s"], ["stretch", 180, "s"]]], rounds: 1 },
];
const SEC_PER_REP = 3;
function progState(id) { S.progs = S.progs || {}; return S.progs[id] || (S.progs[id] = { done: [] }); }
function activeProgram() { return PROGRAMS.find(p => p.id === S.activeProg); }
function nextDayIndex(p) { return progState(p.id).done.length % p.days.length; }
function workoutMinutes(p, di) { const d = p.days[di]; let s = 0; d.forEach(([, n, t]) => s += (t === "s" ? n : n * SEC_PER_REP) + p.rest); return Math.round(s * p.rounds / 60); }
function workoutKcal(p, di) { const kg = curWeight(); let k = 0; p.days[di].forEach(([id, n, t]) => k += EXS[id][2] * kg * ((t === "s" ? n : n * SEC_PER_REP) / 3600)); return Math.round(k * p.rounds * 1.1); }

function renderWorkouts() {
  const ap = activeProgram();
  const st = ap ? progState(ap.id) : null, di = ap ? nextDayIndex(ap) : 0;
  const week = st ? Math.floor(st.done.length / ap.perWeek) + 1 : 0;
  const thisWeek = (() => { const now = new Date(), d = (now.getDay() + 1) % 7; const from = new Date(now); from.setDate(now.getDate() - d); return Object.entries(S.ex || {}).filter(([k]) => k >= key(from)).reduce((a, [, l]) => a + l.length, 0); })();
  const burnWeek = (() => { let s = 0; for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); s += ((S.ex || {})[key(d)] || []).reduce((a, e) => a + e.k, 0); } return s; })();
  app.innerHTML = `<div class="head"><h1>التمارين</h1><button class="chip" id="wo-log">+ سجّل نشاط</button></div>
  <div class="stack">
    <div class="stat-grid three"><div class="stat"><small>تمارين هالأسبوع</small><b class="num">${fmt(thisWeek)}</b></div>
      <div class="stat"><small>حرق آخر ٧ أيام</small><b class="num">${fmt(burnWeek)}<i>سعرة</i></b></div>
      <div class="stat"><small>أيام متتالية</small><b class="num">${fmt(streak())}<i>🔥</i></b></div></div>
    ${ap ? `<div class="card hero-card">
      <div class="row between"><span class="pill">${ap.icon} برنامجك</span><small class="muted">الأسبوع ${fmt(Math.min(week, ap.weeks))} من ${fmt(ap.weeks)}</small></div>
      <h2 style="font-size:20px">${ap.name}</h2>
      <div class="prog-bar"><i style="width:${Math.min(100, st.done.length / (ap.weeks * ap.perWeek) * 100)}%"></i></div>
      <small class="muted">${fmt(st.done.length)} من ${fmt(ap.weeks * ap.perWeek)} تمرين · اليوم: ${ap.days.length > 1 ? "يوم " + "أب"[di] + " · " : ""}${fmt(workoutMinutes(ap, di))} دقيقة · ≈ ${fmt(workoutKcal(ap, di))} سعرة</small>
      <div class="row" style="gap:8px"><button class="btn" id="wo-start" style="flex:1">▶ ابدأ تمرين اليوم</button><button class="btn ghost" id="wo-view">التفاصيل</button></div></div>`
    : `<div class="card hero-card"><h2>اختار برنامج يمشي معك</h2><p class="muted" style="margin:0">التطبيق بيعطيك تمرين كل يوم، وبيعدّلك التكرارات والراحة، وبيسجل السعرات المحروقة لحاله.</p></div>`}
    <h2 style="margin-top:6px">البرامج</h2>
    <div class="prog-list">${PROGRAMS.map(p => `<button class="prog-card ${S.activeProg === p.id ? "on" : ""}" data-prog="${p.id}">
      <span class="prog-ic">${p.icon}</span><span class="t"><b>${p.name}</b><small>${p.tag} · ${p.level} · ${fmt(p.perWeek)} أيام/أسبوع · ${fmt(p.weeks)} أسابيع</small></span><span class="muted">${LANG === "en" ? "›" : "‹"}</span></button>`).join("")}</div>
    <h2 style="margin-top:6px">مكتبة التمارين</h2>
    <div class="card foods">${Object.entries(EXS).map(([id, e]) => `<button class="food" data-ex="${id}"><span class="t">${e[0]}<small>${e[1]}</small></span><span class="muted">${LANG === "en" ? "›" : "‹"}</span></button>`).join("")}</div>
  </div>`;
  $("#wo-log").onclick = () => exerciseSheet();
  const s = $("#wo-start"); if (s) s.onclick = () => startPlayer(ap, di);
  const v = $("#wo-view"); if (v) v.onclick = () => programSheet(ap.id);
  app.querySelectorAll("[data-prog]").forEach(b => b.onclick = () => programSheet(b.dataset.prog));
  app.querySelectorAll("[data-ex]").forEach(b => b.onclick = () => { const e = EXS[b.dataset.ex]; sheet(`<h2>${e[0]}</h2><span class="pill" style="align-self:flex-start">${e[1]}</span><p style="margin:0;line-height:1.9">${e[3]}</p>`, () => {}); });
}
function programSheet(id) {
  const p = PROGRAMS.find(x => x.id === id), st = progState(id);
  sheet(`<div class="row" style="gap:10px"><span class="prog-ic big">${p.icon}</span><div><h2>${p.name}</h2><small class="muted">${p.tag} · ${p.level}</small></div></div>
    <p style="margin:0">${p.desc}</p>
    <div class="stat-grid three"><div class="stat"><small>المدة</small><b class="num">${fmt(p.weeks)}<i>أسابيع</i></b></div><div class="stat"><small>بالأسبوع</small><b class="num">${fmt(p.perWeek)}<i>أيام</i></b></div><div class="stat"><small>التمرين</small><b class="num">${fmt(workoutMinutes(p, 0))}<i>دقيقة</i></b></div></div>
    ${p.days.map((d, i) => `<div class="card" style="padding:12px"><b>${p.days.length > 1 ? "يوم " + "أب"[i] : "التمرين"} · ${p.rounds > 1 ? fmt(p.rounds) + " جولات" : ""}${p.rest ? " · راحة " + fmt(p.rest) + " ث" : ""}</b>
      ${d.map(([eid, n, t]) => `<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)"><span>${EXS[eid][0]}</span><span class="muted num">${t === "s" ? (n >= 120 ? fmt(n / 60) + " د" : fmt(n) + " ث") : "×" + fmt(n)}</span></div>`).join("")}</div>`).join("")}
    ${S.activeProg === id ? `<div class="row"><button class="btn" id="ps-go" style="flex:1">▶ ابدأ</button><button class="btn ghost" id="ps-reset">من الأول</button></div><small class="muted">خلّصت ${fmt(st.done.length)} تمرين بهالبرنامج.</small>`
      : `<button class="btn" id="ps-pick">اختار هالبرنامج</button>`}`, el => {
    const pick = $("#ps-pick", el); if (pick) pick.onclick = () => { if (!requirePremium("برامج التمارين")) return; S.activeProg = id; save(); closeSheet(); render(); toast("انضاف البرنامج، يلّا نبلّش 💪"); };
    const go = $("#ps-go", el); if (go) go.onclick = () => { closeSheet(); startPlayer(p, nextDayIndex(p)); };
    const rs = $("#ps-reset", el); if (rs) rs.onclick = () => { S.progs[id] = { done: [] }; save(); closeSheet(); render(); };
  });
}

// ===== المدرّب: تمرين تمرين، مع عدّاد وراحة =====
let player = null;
function startPlayer(p, di) {
  if (!requirePremium("المدرّب")) return;
  const steps = [];
  for (let r = 0; r < p.rounds; r++) p.days[di].forEach(([id, n, t], i) => {
    steps.push({ id, n, t, round: r + 1 });
    const last = r === p.rounds - 1 && i === p.days[di].length - 1;
    if (p.rest && !last) steps.push({ rest: p.rest });
  });
  player = { p, di, steps, i: 0, left: 0, paused: false, started: Date.now(), timer: null };
  document.querySelector("nav.tabs").hidden = true;
  try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(l => player && (player.lock = l)).catch(() => {}); } catch (e) {}
  playerStep();
}
function beep() { try { const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain(); o.frequency.value = 880; g.gain.value = 0.15; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.18); } catch (e) {} }
function playerStep() {
  const P = player; if (!P) return;
  clearInterval(P.timer);
  if (P.i >= P.steps.length) return finishPlayer();
  const s = P.steps[P.i], next = P.steps.slice(P.i + 1).find(x => !x.rest);
  const timed = s.rest || s.t === "s";
  P.left = s.rest || (s.t === "s" ? s.n : 0);
  const work = P.steps.filter(x => !x.rest).length, doneWork = P.steps.slice(0, P.i).filter(x => !x.rest).length;
  const mmss = t => (t >= 60 ? Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0") : String(t));
  app.innerHTML = `<div class="player ${s.rest ? "resting" : ""}">
    <div class="row between"><button class="icon-btn" id="pl-x" aria-label="إنهاء">✕</button><span class="muted num">${fmt(doneWork + (s.rest ? 0 : 1))}/${fmt(work)}</span><span class="pill">${s.rest ? "راحة" : "جولة " + fmt(s.round) + "/" + fmt(P.p.rounds)}</span></div>
    <div class="prog-bar"><i style="width:${doneWork / work * 100}%"></i></div>
    <div class="pl-main">
      <span class="pl-label">${s.rest ? "خذ نفس 😮‍💨" : EXS[s.id][1]}</span>
      <h1 class="pl-name">${s.rest ? "راحة" : EXS[s.id][0]}</h1>
      ${timed ? `<div class="pl-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="var(--line)" stroke-width="9"/><circle id="pl-arc" cx="60" cy="60" r="52" fill="none" stroke="${s.rest ? "var(--water)" : "var(--herb)"}" stroke-width="9" stroke-linecap="round" stroke-dasharray="326.7" stroke-dashoffset="0" transform="rotate(-90 60 60)"/></svg><b class="num" id="pl-t">${mmss(P.left)}</b></div>`
        : `<div class="pl-reps num">×${fmt(s.n)}</div><span class="muted">تكرار</span>`}
      ${!s.rest ? `<p class="muted pl-desc">${EXS[s.id][3]}</p>` : next ? `<p class="muted">التالي: <b>${EXS[next.id][0]}</b> ${next.t === "s" ? fmt(next.n) + " ث" : "×" + fmt(next.n)}</p>` : ""}
    </div>
    <div class="row" style="gap:10px">${timed ? `<button class="btn ghost" id="pl-pause" style="flex:1">${P.paused ? "▶ كمّل" : "⏸ وقّف"}</button>` : ""}
      <button class="btn" id="pl-next" style="flex:2">${s.rest ? "تخطّى الراحة ⏭" : timed ? "التالي ⏭" : "خلّصت ✓"}</button></div></div>`;
  const total = s.rest || s.n;
  const tick = () => {
    if (P.paused) return;
    P.left--;
    const t = $("#pl-t"), arc = $("#pl-arc");
    if (t) t.textContent = mmss(Math.max(0, P.left));
    if (arc) arc.setAttribute("stroke-dashoffset", 326.7 * (1 - P.left / total));
    if (P.left <= 3 && P.left > 0) beep();
    if (P.left <= 0) { beep(); P.i++; playerStep(); }
  };
  if (timed) P.timer = setInterval(tick, 1000);
  $("#pl-next").onclick = () => { P.i++; playerStep(); };
  const pz = $("#pl-pause"); if (pz) pz.onclick = () => { P.paused = !P.paused; pz.textContent = P.paused ? "▶ كمّل" : "⏸ وقّف"; };
  $("#pl-x").onclick = () => { if (P.i > 0) finishPlayer(true); else stopPlayer(); };
}
function stopPlayer() { if (!player) return; clearInterval(player.timer); try { player.lock && player.lock.release(); } catch (e) {} player = null; render(); }
function finishPlayer(early) {
  const P = player; clearInterval(P.timer);
  const mins = Math.max(1, Math.round((Date.now() - P.started) / 60000));
  const doneSteps = P.steps.slice(0, P.i).filter(x => !x.rest);
  const kg = curWeight();
  const kcal = Math.round(doneSteps.reduce((a, s) => a + EXS[s.id][2] * kg * ((s.t === "s" ? s.n : s.n * SEC_PER_REP) / 3600), 0) * 1.1);
  if (doneSteps.length) {
    const k = key(new Date()); S.ex = S.ex || {}; (S.ex[k] = S.ex[k] || []).push({ n: P.p.name, min: mins, k: kcal, prog: P.p.id });
    if (!early || doneSteps.length >= P.steps.filter(x => !x.rest).length * 0.6) progState(P.p.id).done.push(k);
    save();
  }
  try { P.lock && P.lock.release(); } catch (e) {}
  player = null;
  app.innerHTML = `<div class="player done"><div class="pl-main"><span style="font-size:64px">${early ? "👍" : "🏆"}</span>
    <h1 class="pl-name">${early ? "منيح، كل حركة بتفرق" : "خلّصت تمرين اليوم!"}</h1>
    <div class="stat-grid three"><div class="stat"><small>الوقت</small><b class="num">${fmt(mins)}<i>دقيقة</i></b></div><div class="stat"><small>تمارين</small><b class="num">${fmt(doneSteps.length)}</b></div><div class="stat"><small>حرق</small><b class="num">${fmt(kcal)}<i>سعرة</i></b></div></div>
    <p class="muted">انضافت السعرات المحروقة لميزانية يومك.</p></div><button class="btn" id="pl-done">تمام</button></div>`;
  $("#pl-done").onclick = () => { tab = "today"; render(); };
}
