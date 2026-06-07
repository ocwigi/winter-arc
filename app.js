/* ===================================================================
   Winter Arc — 92-day winter cut tracker (vanilla, localStorage)
   =================================================================== */
(() => {
  "use strict";

  /* ----------------------------- CONFIG ----------------------------- */
  const SEASON_LENGTH = 92;
  const T = { calCap: 1800, protein: 165, steps: 10000, weight: 75, bf: 15 };
  const WEEKLY = { gym: 4, sauna: 3, ai: 7 };
  const KEY = "winter-arc-v2";
  const DEFAULT_START = "2026-06-01";

  const GROUP = {
    body: "#22D3EE", training: "#FB923C", discipline: "#A78BFA",
  };
  const TIER_COLOR = {
    perfect: "#A3E635", banked: "#34D399", solid: "#FBBF24",
    light: "#475569", missed: "#7F1D1D", empty: "rgba(255,255,255,0.05)",
  };
  const STATUS_CLASS = { green: "s-green", amber: "s-amber", red: "s-red", rest: "s-rest", none: "s-none" };

  /* ----------------------------- ICONS ----------------------------- */
  const PATHS = {
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    scale: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="11" r="1"/><path d="M12 11 15 8"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    beef: '<circle cx="9" cy="9" r="6"/><path d="M13 13l6 6"/><path d="M17 17l2-2"/>',
    footprints: '<ellipse cx="8" cy="9" rx="3" ry="5"/><ellipse cx="16" cy="15" rx="3" ry="5"/>',
    dumbbell: '<path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12"/>',
    waves: '<path d="M2 8c2-2 4 2 6 0s4 2 6 0 4 2 6 0M2 14c2-2 4 2 6 0s4 2 6 0 4 2 6 0"/>',
    pill: '<rect x="2" y="8" width="20" height="8" rx="4"/><path d="M12 8v8"/>',
    wine: '<path d="M8 22h8M12 16v6M6 3h12l-1 6a5 5 0 0 1-10 0z"/>',
    cap: '<path d="M2 9l10-4 10 4-10 4z"/><path d="M6 11v5c0 1 3 2 6 2s6-1 6-2v-5"/>',
    lock: '<rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3"/>',
    trenddown: '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
    sparkles: '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9z"/><path d="M19 15l.7 2.1L22 18l-2.3.7L19 21l-.7-2.3L16 18z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    chevL: '<polyline points="15 6 9 12 15 18"/>',
    chevR: '<polyline points="9 6 15 12 9 18"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
  };
  function ic(name, size = 16, color = "currentColor", sw = 2) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${PATHS[name] || ""}</svg>`;
  }

  /* ----------------------------- DATE ----------------------------- */
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const today0 = () => { const x = new Date(); x.setHours(0, 0, 0, 0); return x; };
  const niceDate = (d) => new Date(d).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
  const buzz = (ms = 8) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const round1 = (n) => Math.round(n * 10) / 10;

  /* ----------------------------- STATE ----------------------------- */
  const blank = () => ({ weight: null, bf: null, calories: 0, protein: 0, steps: 0, gym: false, sauna: false, supplements: false, aiHours: 0, alcohol: false, banked: false });
  let state, ui;

  function defaultState() {
    return {
      seasonStart: DEFAULT_START,
      logs: {},
      quests: [
        { id: 1, text: "Hit 75kg bodyweight", done: false },
        { id: 2, text: "Reach 15% body fat", done: false },
        { id: 3, text: "Bank 21 perfect days", done: false },
      ],
      reminders: { enabled: false, weighIn: "07:30", evening: "21:00", ai: "08:00" },
      directives: { assigned: {} },
    };
  }
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { state = JSON.parse(raw); } else { state = defaultState(); save(); } }
    catch (e) { state = defaultState(); }
    if (!state.reminders) state.reminders = defaultState().reminders;
    if (!state.quests) state.quests = [];
    if (!state.logs) state.logs = {};
    if (!state.seasonStart) state.seasonStart = DEFAULT_START;
    if (!state.directives) state.directives = { assigned: {} };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  const seasonEnd = () => fmt(addDays(new Date(state.seasonStart), SEASON_LENGTH - 1));
  const dayNumOf = (dStr) => Math.floor((new Date(dStr) - new Date(state.seasonStart)) / 86400000) + 1;
  const logFor = (dStr) => state.logs[dStr] || blank();
  const setLog = (patch) => { state.logs[ui.sel] = { ...logFor(ui.sel), ...patch }; save(); render(); };

  /* ----------------------------- SCORING ----------------------------- */
  function coreFlags(l) {
    return { weigh: l.weight != null && l.weight > 0, cal: l.calories > 0 && l.calories <= T.calCap, pro: l.protein >= T.protein, steps: l.steps >= T.steps };
  }
  function coreCount(l) { const f = coreFlags(l); return [f.weigh, f.cal, f.pro, f.steps].filter(Boolean).length; }
  function dayScore(l) {
    const f = coreFlags(l); let s = 0;
    if (f.weigh) s += 15; if (f.cal) s += 25; if (f.pro) s += 25; if (f.steps) s += 15;
    if (l.supplements) s += 10;
    if (l.aiHours >= 1) s += 10; else if (l.aiHours > 0) s += 5;
    return s;
  }
  function tier(l) {
    const c = coreCount(l);
    if (c === 4 && l.supplements && l.aiHours >= 1) return "perfect";
    if (c === 4) return "banked";
    if (c === 3) return "solid";
    if (c >= 1) return "light";
    return "empty";
  }
  const hasActivity = (l) => l.weight != null || l.calories > 0 || l.protein > 0 || l.steps > 0 || l.gym || l.sauna || l.supplements || l.aiHours > 0 || l.alcohol;

  function formScore() {
    // EWMA of day scores from the first logged day to today
    const todayStr = fmt(today0());
    const dn = Math.min(dayNumOf(todayStr), SEASON_LENGTH);
    let firstLogged = null;
    for (let i = 1; i <= dn; i++) { const k = fmt(addDays(new Date(state.seasonStart), i - 1)); if (hasActivity(logFor(k))) { firstLogged = i; break; } }
    if (firstLogged == null) return 0;
    let e = null; const a = 0.3;
    for (let i = firstLogged; i <= dn; i++) { const k = fmt(addDays(new Date(state.seasonStart), i - 1)); const s = dayScore(logFor(k)); e = e == null ? s : a * s + (1 - a) * e; }
    return Math.round(e || 0);
  }
  const formColor = (v) => (v >= 80 ? "#34D399" : v >= 60 ? "#A3E635" : v >= 40 ? "#FBBF24" : "#F87171");
  const formLabel = (v) => (v >= 80 ? "DIALLED IN" : v >= 60 ? "ON TRACK" : v >= 40 ? "SLIPPING" : v > 0 ? "RECOVER" : "BEGIN");

  function weightSeries() {
    const todayStr = fmt(today0());
    const dn = Math.min(dayNumOf(todayStr), SEASON_LENGTH);
    const pts = []; let trend = null; const a = 0.1; let start = null;
    for (let i = 1; i <= SEASON_LENGTH; i++) {
      const k = fmt(addDays(new Date(state.seasonStart), i - 1));
      const raw = state.logs[k] && state.logs[k].weight != null ? state.logs[k].weight : null;
      if (raw != null) { trend = trend == null ? raw : a * raw + (1 - a) * trend; if (start == null) start = raw; }
      pts.push({ day: i, raw, trend: i <= dn && trend != null ? round1(trend * 10) / 10 : null });
    }
    const tp = pts.filter((p) => p.trend != null); let rate = 0;
    if (tp.length >= 3) { const s = tp.slice(-8); rate = (s[s.length - 1].trend - s[0].trend) / (s[s.length - 1].day - s[0].day); }
    const trendNow = tp.length ? tp[tp.length - 1].trend : null; let proj = null;
    if (trendNow != null) { proj = round1(trendNow + rate * (SEASON_LENGTH - dn)); const ld = tp[tp.length - 1].day; pts.forEach((p) => { if (p.day >= ld) p.proj = round1(trendNow + rate * (p.day - ld)); }); }
    return { pts, trendNow, proj, start, rate };
  }

  /* ----------------------------- DIRECTIVES (daily line) ----------------------------- */
  const DIRECTIVES = {
    neutral: [
      { id: "n1", text: "Discipline is just remembering what you want." },
      { id: "n2", text: "The work doesn't care how you feel about it." },
      { id: "n3", text: "Comfort is the enemy this season." },
      { id: "n4", text: "You don't need motivation. You need to start." },
      { id: "n5", text: "Small reps, stacked daily. That's the whole game." },
      { id: "n6", text: "Nobody is coming to do it for you." },
      { id: "n7", text: "The plan only works if you do." },
      { id: "n8", text: "Win the next decision." },
      { id: "n9", text: "Hard choices now, easy life later." },
      { id: "n10", text: "Tired is not a reason. It's a condition." },
      { id: "n11", text: "Eat for the body you're building, not the one you're bored of." },
      { id: "n12", text: "Hunger is just discipline you can feel." },
      { id: "n13", text: "Every meal is a vote. Vote well." },
      { id: "n14", text: "Show up before you feel like it." },
      { id: "n15", text: "The scale lies daily. The trend tells the truth." },
      { id: "n16", text: "You're not cutting weight. You're building proof." },
      { id: "n17", text: "Do it tired. Do it anyway." },
      { id: "n18", text: "Standards, not feelings." },
      { id: "n19", text: "The season is short. Spend it well." },
      { id: "n20", text: "Boring consistency beats heroic effort." },
      { id: "n21", text: "Make the right thing the easy thing." },
      { id: "n22", text: "Future you is watching this decision." },
      { id: "n23", text: "Don't negotiate with the version of you that wants to quit." },
      { id: "n24", text: "Earn the day." },
      { id: "n25", text: "Protein, steps, sleep. Repeat. Win." },
      { id: "n26", text: "The hard way is the fast way." },
      { id: "n27", text: "No zero days." },
      { id: "n28", text: "Be honest in the log. It's only for you." },
      { id: "n29", text: "Cravings pass. Regret lingers." },
      { id: "n30", text: "You've done harder things than this." },
      { id: "n31", text: "Stack one clean day. Then do it again." },
      { id: "n32", text: "The grind is the point, not the obstacle." },
      { id: "n33", text: "Decide once. Then stop deciding." },
      { id: "n34", text: "Move the trend, not the mood." },
      { id: "n35", text: "Discipline today buys freedom in spring." },
      { id: "n36", text: "Quiet work. Loud results." },
      { id: "n37", text: "Don't break the chain you're proud of." },
      { id: "n38", text: "The cut is won in the kitchen, proven in the gym." },
      { id: "n39", text: "Less talking yourself out of it. More doing it." },
      { id: "n40", text: "Hold the line." },
      { id: "n41", text: "What you do off-plan is also a decision." },
      { id: "n42", text: "Consistency is a skill. Practise it." },
      { id: "n43", text: "You're closer than the scale says." },
      { id: "n44", text: "Bank it. Move on. Repeat." },
      { id: "n45", text: "The body keeps the score you log." },
      { id: "n46", text: "Sweat now or sulk later." },
      { id: "n47", text: "You have power over your mind, not outside events. Realise this and you find strength.", by: "Marcus Aurelius" },
      { id: "n48", text: "Waste no more time arguing what a good man should be. Be one.", by: "Marcus Aurelius" },
      { id: "n49", text: "The impediment to action advances action. What stands in the way becomes the way.", by: "Marcus Aurelius" },
      { id: "n50", text: "We suffer more in imagination than in reality.", by: "Seneca" },
      { id: "n51", text: "It is not that we have a short time to live, but that we waste much of it.", by: "Seneca" },
      { id: "n52", text: "No man is free who is not master of himself.", by: "Epictetus" },
      { id: "n53", text: "First say to yourself what you would be, then do what you must do.", by: "Epictetus" },
      { id: "n54", text: "Difficulties strengthen the mind, as labour does the body.", by: "Seneca" },
      { id: "n55", text: "Confine yourself to the present.", by: "Marcus Aurelius" },
    ],
    slipping: [
      { id: "s1", text: "You already know what to do. Go do it." },
      { id: "s2", text: "Stop drifting. Pick one habit and nail it today." },
      { id: "s3", text: "Bad patch, not a bad season. Reset now." },
      { id: "s4", text: "The streak's gone. The standard isn't. Get back on it." },
      { id: "s5", text: "Don't tidy up the wreckage. Just take the next right step." },
      { id: "s6", text: "Form's dropped. That's information, not a verdict." },
      { id: "s7", text: "One clean day breaks the slide. Make today it." },
      { id: "s8", text: "Lower the bar to 'just start'. Then start." },
      { id: "s9", text: "You're not behind. You're one decision from back on track." },
      { id: "s10", text: "Quit explaining it. Just log a good day." },
      { id: "s11", text: "Momentum is built, not found. Build it now." },
      { id: "s12", text: "The dip is normal. Staying down is the choice." },
      { id: "s13", text: "Get up. The plan still works." },
      { id: "s14", text: "Forgive the day. Don't repeat it." },
    ],
    debt: [
      { id: "d1", text: "It's logged. The next rep is the one that counts." },
      { id: "d2", text: "Own it, don't spiral. Tomorrow's clean." },
      { id: "d3", text: "One night doesn't undo the season. Quitting would." },
      { id: "d4", text: "Debt noted. Pay it down with a clean week." },
      { id: "d5", text: "No guilt, no excuses. Just back on plan." },
      { id: "d6", text: "Honest enough to log it. Be disciplined enough to move on." },
      { id: "d7", text: "Slip logged. Standard intact. Continue." },
      { id: "d8", text: "Drinking days are data, not destiny." },
    ],
    perfect: [
      { id: "p1", text: "Perfect day banked. This is who you are now." },
      { id: "p2", text: "That's the standard. Set it again tomorrow." },
      { id: "p3", text: "Clean sweep. Don't celebrate, repeat." },
      { id: "p4", text: "This is what the trend is made of." },
      { id: "p5", text: "Locked. Stack another one." },
      { id: "p6", text: "You didn't find time, you took it. Good." },
      { id: "p7", text: "Days like this win seasons." },
      { id: "p8", text: "Quiet, complete, done. Excellent." },
      { id: "p9", text: "Proof, not promises. Keep printing it." },
      { id: "p10", text: "The boring perfect day. The most powerful one." },
      { id: "p11", text: "Nailed every core. That compounds." },
      { id: "p12", text: "Full marks. Now make it unremarkable." },
      { id: "p13", text: "That's a brick in the wall. Lay another." },
      { id: "p14", text: "The rep that separates you. Again tomorrow." },
    ],
    ontrack: [
      { id: "o1", text: "On pace. Don't get comfortable, get consistent." },
      { id: "o2", text: "The trend's moving. Keep feeding it." },
      { id: "o3", text: "Discipline's paying out. Reinvest it today." },
      { id: "o4", text: "You're building something. Don't stop now." },
      { id: "o5", text: "Strong form. Protect it with one more clean day." },
      { id: "o6", text: "Ahead is earned, not owed. Keep going." },
      { id: "o7", text: "This is the easy part of momentum. Use it." },
      { id: "o8", text: "The work is working. Trust it, repeat it." },
      { id: "o9", text: "Good week building. Add a day." },
      { id: "o10", text: "Don't admire the progress. Extend it." },
      { id: "o11", text: "You're in rhythm. Stay in it." },
      { id: "o12", text: "Winning quietly. Best kind." },
      { id: "o13", text: "The line's heading the right way. Hold course." },
      { id: "o14", text: "Keep stacking. Spring is the payoff." },
      { id: "o15", text: "Consistency looks like this. More of it." },
    ],
  };
  const DC_COLOR = { neutral: "#A3E635", slipping: "#FBBF24", debt: "#F87171", perfect: "#A3E635", ontrack: "#34D399" };

  function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function loggedDayCount() {
    const dn = Math.min(dayNumOf(fmt(today0())), SEASON_LENGTH); let c = 0;
    for (let i = 1; i <= dn; i++) if (hasActivity(logFor(fmt(addDays(new Date(state.seasonStart), i - 1))))) c++;
    return c;
  }
  function directiveContext() {
    const todayStr = fmt(today0()), l = logFor(todayStr);
    if (l.alcohol) return "debt";
    if (l.banked && tier(l) === "perfect") return "perfect";
    if (loggedDayCount() < 4) return "neutral";
    const form = formScore();
    if (form > 0 && form < 40) return "slipping";
    const ws = weightSeries();
    if (form >= 80 || (ws.proj != null && ws.proj <= T.weight + 0.4 && form >= 60)) return "ontrack";
    return "neutral";
  }
  function selectDirective() {
    if (!state.directives) state.directives = { assigned: {} };
    const todayStr = fmt(today0()), ctx = directiveContext(), pool = DIRECTIVES[ctx];
    const assigned = state.directives.assigned;
    let pick = pool.find((p) => p.id === assigned[todayStr]);
    if (!pick) {
      const counts = {};
      for (const dt in assigned) { if (dt === todayStr) continue; counts[assigned[dt]] = (counts[assigned[dt]] || 0) + 1; }
      let cands = pool.filter((p) => (counts[p.id] || 0) < 2);
      if (!cands.length) cands = pool.slice();
      const minC = Math.min(...cands.map((p) => counts[p.id] || 0));
      cands = cands.filter((p) => (counts[p.id] || 0) === minC);
      pick = cands[hashStr(todayStr + ctx) % cands.length];
      assigned[todayStr] = pick.id; save();
    }
    return { text: pick.text, by: pick.by, ctx };
  }
  function directiveBanner() {
    if (ui.sel !== fmt(today0()) || ui.dismissDirective) return "";
    const d = selectDirective(), dc = DC_COLOR[d.ctx] || "#A3E635";
    return `<div class="directive" style="--dc:${dc}">
      <span class="dq">${ic("sparkles", 14, "var(--dc)")}</span>
      <div class="dtx"><p>${esc(d.text)}</p>${d.by ? `<span>— ${esc(d.by)}</span>` : ""}</div>
      <button class="dx" data-act="dismissdirective">${ic("x", 13, "#6B7682")}</button>
    </div>`;
  }

  /* ----------------------------- HABIT STATUS ----------------------------- */
  const HABITS = [
    { id: "weight", label: "Weigh-in", icon: "scale", g: "body", kind: "binary" },
    { id: "calories", label: "Calories ≤1,800", icon: "flame", g: "body", kind: "cap" },
    { id: "protein", label: "Protein 165g", icon: "beef", g: "body", kind: "min", good: 165, ok: 140 },
    { id: "steps", label: "Steps 10k", icon: "footprints", g: "body", kind: "min", good: 10000, ok: 7500 },
    { id: "gym", label: "Gym · 4/wk", icon: "dumbbell", g: "training", kind: "weeklybool", target: 4 },
    { id: "sauna", label: "Sauna · 3/wk", icon: "waves", g: "training", kind: "weeklybool", target: 3 },
    { id: "supplements", label: "Supplements", icon: "pill", g: "discipline", kind: "bool" },
    { id: "ai", label: "AI learning · 7h/wk", icon: "cap", g: "discipline", kind: "hours", target: 7 },
    { id: "alcohol", label: "No alcohol", icon: "wine", g: "discipline", kind: "noalc" },
  ];
  function dayStatus(h, l) {
    if (!l) return "none";
    switch (h.kind) {
      case "binary": return l.weight != null ? "green" : "none";
      case "cap": { const c = l.calories || 0; return !c ? "none" : c <= T.calCap ? "green" : c <= 2000 ? "amber" : "red"; }
      case "min": { const v = l[h.id] || 0; return !v ? "none" : v >= h.good ? "green" : v >= h.ok ? "amber" : "red"; }
      case "bool": return l.supplements ? "green" : (hasActivity(l) ? "red" : "none");
      case "weeklybool": return l[h.id] ? "green" : "rest";
      case "hours": { const a = l.aiHours || 0; return a >= 1 ? "green" : a > 0 ? "amber" : "none"; }
      case "noalc": return l.alcohol ? "red" : (hasActivity(l) ? "green" : "none");
      default: return "none";
    }
  }

  /* ----------------------------- COMPONENTS ----------------------------- */
  function ringSVG(form) {
    const c = formColor(form), R = 42, circ = 2 * Math.PI * R, off = circ * (1 - form / 100);
    return `<div style="position:relative;width:104px;height:104px">
      <svg width="104" height="104" style="transform:rotate(-90deg)">
        <circle cx="52" cy="52" r="${R}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="9"/>
        <circle cx="52" cy="52" r="${R}" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${off}" style="transition:stroke-dashoffset .6s ease,stroke .4s"/>
      </svg>
      <div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center">
        <div><div class="mono" style="font-size:30px;font-weight:700;color:#fff;line-height:1">${form}</div>
        <div style="font-size:9.5px;color:${c};font-weight:700;letter-spacing:1px">${formLabel(form)}</div></div>
      </div></div>`;
  }

  function stepper(field, label, value, unit, target, step, chips, accent, cap) {
    const pct = Math.min(value / target, cap ? 1.08 : 1) * 100;
    const over = cap && value > target;
    const hit = cap ? value > 0 && value <= target : value >= target;
    const col = hit ? accent : over ? "#F87171" : "#E7ECEF";
    const fill = over ? "linear-gradient(90deg,#F87171,#7F1D1D)" : `linear-gradient(90deg,${accent},${accent}aa)`;
    const chipsHTML = chips.map((c) => `<button class="chip" data-act="${c.set != null ? "setval" : "step"}" data-field="${field}" data-${c.set != null ? "val" : "delta"}="${c.set != null ? c.set : c.add}">${c.label}</button>`).join("");
    return `<div class="step">
      <div class="row"><span class="lbl">${label}</span>
        <span class="val" style="color:${col}">${value.toLocaleString()}<small> / ${target.toLocaleString()} ${unit}</small></span></div>
      <div class="bar"><i style="width:${pct}%;background:${fill}"></i></div>
      <div class="controls">
        <button class="cbtn" data-act="step" data-field="${field}" data-delta="-${step}">${ic("minus", 14, "#C4CCD4")}</button>
        ${chipsHTML}
        <button class="cbtn" data-act="step" data-field="${field}" data-delta="${step}">${ic("plus", 14, "#C4CCD4")}</button>
      </div></div>`;
  }

  function toggle(field, label, icon, on, accent, hint, alc) {
    return `<button class="tg ${on ? "on" : ""} ${alc ? "alc" : ""}" data-act="toggle" data-field="${field}">
      <span class="box">${on ? ic("check", 16, "#0A0C0F", 3) : ic(icon, 15, "#8A95A1")}</span>
      <span class="tx"><b>${label}</b>${hint ? `<span>${hint}</span>` : ""}</span></button>`;
  }

  function quota(label, icon, done, target, accent) {
    let segs = ""; for (let i = 0; i < target; i++) segs += `<i style="${i < done ? `background:${accent};box-shadow:0 0 10px -2px ${accent}` : ""}"></i>`;
    return `<div class="quota">
      <div class="row"><span class="lbl">${ic(icon, 14, accent)} ${label}</span>
        <span class="val" style="color:${done >= target ? accent : "#E7ECEF"}">${done}<small>/${target} wk</small></span></div>
      <div class="segs">${segs}</div></div>`;
  }

  /* ----------------------------- TABS ----------------------------- */
  function todayTab() {
    const sel = ui.sel, l = logFor(sel), form = formScore(), ws = weightSeries();
    const core = coreFlags(l), cn = coreCount(l), canBank = cn === 4 && !l.banked;
    const debt = Object.values(state.logs).filter((x) => x.alcohol).length;
    const win7 = [...Array(7)].map((_, i) => logFor(fmt(addDays(new Date(sel), -i))));
    const gymWk = win7.filter((x) => x.gym).length, saunaWk = win7.filter((x) => x.sauna).length;
    const aiWk = round1(win7.reduce((s, x) => s + (x.aiHours || 0), 0));
    const pPct = l.calories > 0 ? Math.round((l.protein * 4 / l.calories) * 100) : 0;
    const onTrack = ws.proj != null && ws.proj <= T.weight + 0.4;

    // AI strip
    let strip = "";
    for (let i = 6; i >= 0; i--) {
      const k = fmt(addDays(new Date(sel), -i)); const v = logFor(k).aiHours || 0; const tdy = k === sel;
      const h = Math.min(v / 2, 1) * 28 + 3; const col = v >= 1 ? GROUP.discipline : v > 0 ? GROUP.discipline + "88" : "rgba(255,255,255,0.08)";
      strip += `<div class="day"><div class="col"><i style="height:${h}px;background:${col};${tdy ? "border:1px solid #fff" : ""}"></i></div><div class="d" style="${tdy ? "color:#fff;font-weight:700" : ""}">${new Date(k).toLocaleDateString("en-AU", { weekday: "narrow" })}</div></div>`;
    }

    const coreTags = [["Weigh", core.weigh], ["≤1800", core.cal], ["165g", core.pro], ["10k", core.steps]]
      .map(([t, ok]) => `<span class="${ok ? "ok" : ""}">${t}</span>`).join("");

    return `<div class="fadeup">
      ${directiveBanner()}
      <div class="hero">
        <div class="card glow g-body ring-wrap" style="--accent:${formColor(form)};padding-top:16px;padding-bottom:16px">
          <button class="iconbtn sm" data-act="sheet" data-sheet="scoring" style="position:absolute;top:12px;right:12px">${ic("info", 13, "#8A95A1")}</button>
          <div class="ring-label">Season Form</div>${ringSVG(form)}
          <div class="ring-sub">Rolling 10-day · recovers fast</div>
        </div>
        <div class="card glow" style="--accent:#34D399;display:flex;flex-direction:column;justify-content:space-between">
          <div><div class="ring-label" style="margin-bottom:0">Trend</div>
            <div class="trend-num"><b>${ws.trendNow != null ? ws.trendNow.toFixed(1) : "–"}</b><span>kg</span></div>
            <div class="subtle" style="margin-top:3px">Target ${T.weight}kg</div></div>
          <div class="proj" style="background:${onTrack ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.1)"}">
            <div class="k">Projected finish</div>
            <div class="v">${ic("trenddown", 14, onTrack ? "#34D399" : "#FBBF24")}<b style="color:${onTrack ? "#34D399" : "#FBBF24"}">${ws.proj != null ? ws.proj.toFixed(1) : "–"}kg</b><small>${ws.trendNow == null ? "no data" : onTrack ? "on track" : "push"}</small></div>
          </div>
        </div>
      </div>

      <div class="card g-body"><span class="stripe" style="background:var(--accent)"></span>
        <div class="ghead"><span class="ic">${ic("activity", 16, "var(--accent)")}</span><div><div class="tt">Body</div><div class="sb">The instrument panel · log anytime</div></div></div>
        <div class="weigh"><span>${ic("scale", 18, "var(--accent)")}</span><div class="t"><b>Weigh-in</b><span>Trend is the truth, not the number</span></div>
          <input type="number" inputmode="decimal" step="0.1" placeholder="–" value="${l.weight != null ? l.weight : ""}" data-changefield="weight" /><span class="u">kg</span></div>
        ${stepper("calories", "Calories", l.calories, "kcal", T.calCap, 50, [{ label: "+100", add: 100 }, { label: "+250", add: 250 }, { label: "+500", add: 500 }], GROUP.body, true)}
        ${stepper("protein", "Protein", l.protein, "g", T.protein, 5, [{ label: "+20", add: 20 }, { label: "+40", add: 40 }, { label: "165", set: 165 }], GROUP.body, false)}
        <div class="rel">${ic("beef", 13, "var(--accent)")}<span>Protein is</span><b style="color:${pPct >= 35 ? "var(--accent)" : "#C4CCD4"}">${pPct}%</b><span>of today's calories</span></div>
        ${stepper("steps", "Steps", l.steps, "", T.steps, 500, [{ label: "+2.5k", add: 2500 }, { label: "+5k", add: 5000 }, { label: "10k", set: 10000 }], GROUP.body, false)}
      </div>

      <div class="card g-training"><span class="stripe" style="background:var(--accent)"></span>
        <div class="ghead"><span class="ic">${ic("dumbbell", 16, "var(--accent)")}</span><div><div class="tt">Training</div><div class="sb">The arena · weekly quotas</div></div></div>
        ${quota("Gym", "dumbbell", gymWk, WEEKLY.gym, GROUP.training)}
        ${quota("Infrared sauna", "waves", saunaWk, WEEKLY.sauna, GROUP.training)}
        <div style="margin-top:12px">
          ${toggle("gym", "Logged gym", "dumbbell", l.gym, GROUP.training)}
          ${toggle("sauna", "Logged sauna", "waves", l.sauna, GROUP.training)}
        </div>
      </div>

      <div class="card g-disc"><span class="stripe" style="background:var(--accent)"></span>
        <div class="ghead"><span class="ic">${ic("lock", 16, "var(--accent)")}</span><div><div class="tt">Discipline</div><div class="sb">The vault · what only you control</div></div></div>
        <div class="ai">
          <div class="top"><span class="ttl">${ic("cap", 16, "var(--disc)")} AI Learning</span>
            <span class="hrs" style="color:${aiWk >= WEEKLY.ai ? "var(--disc)" : "#fff"}">${aiWk}<small>/${WEEKLY.ai}h this week</small></span></div>
          <div class="bar"><i style="width:${Math.min(aiWk / WEEKLY.ai, 1) * 100}%;background:linear-gradient(90deg,var(--disc),#C4B5FD);box-shadow:0 0 12px -2px var(--disc)"></i></div>
          <div class="strip">${strip}</div>
          <div class="addrow"><span class="now">${sel === fmt(today0()) ? "Today" : niceDate(sel)}: <b>${l.aiHours || 0}h</b></span>
            <button class="cbtn" data-act="aiadd" data-delta="-0.5">${ic("minus", 14, "#C4CCD4")}</button>
            <button class="achip" data-act="aiadd" data-delta="0.5">+0.5h</button>
            <button class="achip" data-act="aiadd" data-delta="1">+1h</button>
            <button class="achip" data-act="aiadd" data-delta="1.5">+1.5h</button></div>
        </div>
        ${toggle("supplements", "Supplements", "pill", l.supplements, GROUP.discipline, "Hair · creatine · stack")}
        ${toggle("alcohol", l.alcohol ? "Drinking day — adds to debt" : "No alcohol", "wine", l.alcohol, GROUP.discipline, "Running debt: " + debt, true)}
      </div>

      <div class="bankwrap">
        ${ui.bankPulse ? '<span class="bankpulse"></span>' : ""}
        <button class="bank ${l.banked ? "done" : canBank ? "ready" : ""}" ${canBank ? 'data-act="bank"' : ""}>
          ${l.banked ? ic("lock", 17, "currentColor") + " " + (cn === 4 && l.supplements && l.aiHours >= 1 ? "Perfect day banked" : "Day banked")
            : canBank ? ic("sparkles", 17, "currentColor") + " Bank the day"
            : (4 - cn) + " core habit" + (4 - cn > 1 ? "s" : "") + " to go"}
        </button>
      </div>
      <div class="coretags">${coreTags}</div>
    </div>`;
  }

  function habitsTab() {
    const h = HABITS.find((x) => x.id === ui.habit), accent = GROUP[h.g];
    const todayStr = fmt(today0()); const dn = Math.min(dayNumOf(todayStr), SEASON_LENGTH);

    let cells = "";
    let greens = 0, considered = 0;
    for (let i = 1; i <= SEASON_LENGTH; i++) {
      const k = fmt(addDays(new Date(state.seasonStart), i - 1));
      const st = i > dn ? "none" : dayStatus(h, state.logs[k]);
      if (i <= dn && st !== "none" && st !== "rest") { considered++; if (st === "green") greens++; }
      cells += `<div class="cell ${STATUS_CLASS[st]} ${i === dn ? "today" : ""}"></div>`;
    }
    const rate = considered ? Math.round((greens / considered) * 100) : 0;

    let body;
    if (ui.mode === "day") {
      body = `<div class="daygrid">${cells}</div>`;
    } else {
      const weeks = Math.min(Math.ceil(dn / 7), 14); let rows = "";
      for (let w = 0; w < weeks; w++) {
        const logs = [];
        for (let d = 0; d < 7; d++) { const dnum = w * 7 + d + 1; if (dnum <= dn) { const lg = state.logs[fmt(addDays(new Date(state.seasonStart), dnum - 1))]; if (lg) logs.push(lg); } }
        let st = "none", detail = "";
        if (logs.length || h.kind === "weeklybool" || h.kind === "hours") {
          if (h.kind === "weeklybool") { const c = logs.filter((l) => l[h.id]).length; st = c >= h.target ? "green" : c === h.target - 1 ? "amber" : "red"; detail = `${c}/${h.target}`; }
          else if (h.kind === "hours") { const s = round1(logs.reduce((a, l) => a + (l.aiHours || 0), 0)); st = s >= h.target ? "green" : s >= h.target - 2 ? "amber" : "red"; detail = `${s}h`; }
          else { const g = logs.filter((l) => dayStatus(h, l) === "green").length; const consid = logs.filter((l) => dayStatus(h, l) !== "none").length; const r = consid ? g / consid : 0; st = consid === 0 ? "none" : r >= 0.85 ? "green" : r >= 0.5 ? "amber" : "red"; detail = `${g}/${consid || 0}`; }
        }
        rows += `<div class="weekrow"><span class="wk">Week ${w + 1}</span><div class="barv ${STATUS_CLASS[st]}"><b style="color:${st === "green" ? "#06251A" : "#E7ECEF"}">${detail}</b></div></div>`;
      }
      body = `<div class="weekrows">${rows}</div>`;
    }

    const sel = HABITS.map((x) => `<button class="${x.id === ui.habit ? "on" : ""}" data-act="habit" data-id="${x.id}" style="--accent:${GROUP[x.g]}">${ic(x.icon, 13, x.id === ui.habit ? GROUP[x.g] : "#8A95A1")} ${x.label}</button>`).join("");
    const restLegend = ["gym", "sauna"].includes(h.id) ? '<span><i class="s-rest"></i> Rest</span>' : "";

    return `<div class="fadeup">
      <div class="hsel">${sel}</div>
      <div class="card glow" style="--accent:${accent}"><span class="stripe" style="background:var(--accent)"></span>
        <div class="hhead">
          <div class="l"><span class="ic">${ic(h.icon, 16, "var(--accent)")}</span><div><b>${h.label}</b><small>${rate}% hit rate · ${greens} green days</small></div></div>
          <div class="modetog" style="--accent:${accent}">
            <button class="${ui.mode === "day" ? "on" : ""}" data-act="mode" data-mode="day">day</button>
            <button class="${ui.mode === "week" ? "on" : ""}" data-act="mode" data-mode="week">week</button></div>
        </div>
        ${body}
        <div class="legend"><span><i class="s-green"></i> Hit</span><span><i class="s-amber"></i> Close</span><span><i class="s-red"></i> Miss</span>${restLegend}</div>
      </div>
      <p class="hint">Tap any habit to switch. Day view shows every day of the season; week view rolls each habit up against its weekly target. Backfill missed days from the Today tab using the date arrows.</p>
    </div>`;
  }

  function chartSVG(ws) {
    const W = 320, H = 200, padL = 30, padR = 8, padT = 8, padB = 20;
    const withTrend = ws.pts.filter((p) => p.trend != null || p.raw != null);
    if (!withTrend.length) return '<p class="chart-note">Log a weigh-in to see your trajectory.</p>';
    let yMin = T.weight - 1, yMax = T.weight + 1;
    ws.pts.forEach((p) => { [p.raw, p.trend, p.proj].forEach((v) => { if (v != null) { yMin = Math.min(yMin, v); yMax = Math.max(yMax, v); } }); });
    yMin = Math.floor(yMin - 0.3); yMax = Math.ceil(yMax + 0.3);
    const X = (d) => padL + (d - 1) / (SEASON_LENGTH - 1) * (W - padL - padR);
    const Y = (v) => padT + (yMax - v) / (yMax - yMin) * (H - padT - padB);
    const line = (key, dash) => { const pts = ws.pts.filter((p) => p[key] != null).map((p) => `${X(p.day).toFixed(1)},${Y(p[key]).toFixed(1)}`); return pts.length ? `<polyline points="${pts.join(" ")}" fill="none" stroke="${dash ? "#FBBF24" : "#34D399"}" stroke-width="${dash ? 2 : 3}" ${dash ? 'stroke-dasharray="5 4"' : ""} stroke-linecap="round" stroke-linejoin="round"/>` : ""; };
    const dots = ws.pts.filter((p) => p.raw != null).map((p) => `<circle cx="${X(p.day).toFixed(1)}" cy="${Y(p.raw).toFixed(1)}" r="2" fill="#5B6670"/>`).join("");
    const tY = Y(T.weight);
    let grid = ""; [yMin, (yMin + yMax) / 2, yMax].forEach((v) => { grid += `<line x1="${padL}" y1="${Y(v)}" x2="${W - padR}" y2="${Y(v)}" stroke="rgba(255,255,255,0.05)"/><text x="2" y="${Y(v) + 3}" fill="#5B6670" font-size="9" font-family="monospace">${v}</text>`; });
    let xt = ""; [1, 23, 46, 69, 92].forEach((d) => { xt += `<text x="${X(d)}" y="${H - 5}" fill="#5B6670" font-size="9" text-anchor="middle" font-family="monospace">${d}</text>`; });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}">${grid}
      <line x1="${padL}" y1="${tY}" x2="${W - padR}" y2="${tY}" stroke="#A3E635" stroke-dasharray="4 4"/>
      <text x="${W - padR}" y="${tY - 4}" fill="#A3E635" font-size="9" text-anchor="end" font-family="monospace">${T.weight}kg</text>
      ${line("proj", true)}${line("trend", false)}${dots}${xt}</svg>`;
  }

  function trendTab() {
    const ws = weightSeries();
    const start = ws.start != null ? ws.start : 80;
    const prog = ws.trendNow != null ? Math.max(0, Math.min(1, (start - ws.trendNow) / (start - T.weight))) : 0;
    const lost = ws.trendNow != null ? (start - ws.trendNow).toFixed(1) : "0";
    const toGo = ws.trendNow != null ? Math.max(0, ws.trendNow - T.weight).toFixed(1) : "–";
    const bfArr = Object.values(state.logs).filter((l) => l.bf != null); const bf = bfArr.length ? bfArr[bfArr.length - 1].bf : "–";
    return `<div class="fadeup">
      <div class="card glow" style="--accent:#34D399">
        <div class="cardhead"><span class="t">Weight trajectory</span></div>
        <div class="chart-note">Dots are daily noise. Green line is the truth. Dashed is projection at current rate.</div>
        ${chartSVG(ws)}
      </div>
      <div class="card glow" style="--accent:#34D399">
        <div class="cardhead"><span class="t">Body composition</span></div>
        <div class="bigstat"><div class="k">Lost so far</div><div class="v"><b>${lost}</b><span>kg</span></div></div>
        <div class="bcbar"><i style="width:${prog * 100}%"></i></div>
        <div class="bcrow"><span>${start}kg start</span><span style="color:var(--lime)">${Math.round(prog * 100)}% there</span><span>75kg</span></div>
        <div class="ministats">
          <div class="ministat"><div class="k">To target</div><div class="v">${toGo}<small> kg</small></div></div>
          <div class="ministat"><div class="k">Body fat</div><div class="v">${bf}<small> %</small></div><div class="sub">target ${T.bf}%</div></div>
          <div class="ministat"><div class="k">Rate</div><div class="v">${ws.rate ? (ws.rate * 7).toFixed(2) : "–"}<small> kg/wk</small></div></div>
        </div>
      </div>
    </div>`;
  }

  function seasonTab() {
    const todayStr = fmt(today0()); const dn = Math.min(dayNumOf(todayStr), SEASON_LENGTH);
    let cells = "";
    for (let i = 1; i <= SEASON_LENGTH; i++) {
      const k = fmt(addDays(new Date(state.seasonStart), i - 1)); const l = state.logs[k];
      let color = TIER_COLOR.empty;
      if (i <= dn && l && hasActivity(l)) color = TIER_COLOR[tier(l)];
      else if (i <= dn) color = "rgba(255,255,255,0.04)"; // unlogged past = neutral, forgiving
      cells += `<div class="cell ${i === dn ? "today" : ""}" style="background:${color}">${l && l.alcohol ? '<span class="drink"></span>' : ""}</div>`;
    }
    const banked = Object.values(state.logs).filter((l) => l.banked).length;
    const perfect = Object.values(state.logs).filter((l) => tier(l) === "perfect").length;
    const aiTotal = round1(Object.values(state.logs).reduce((s, l) => s + (l.aiHours || 0), 0));
    let run = 0, best = 0;
    for (let i = 1; i <= dn; i++) { const l = logFor(fmt(addDays(new Date(state.seasonStart), i - 1))); if (coreCount(l) === 4) { run++; best = Math.max(best, run); } else run = 0; }
    const debt = Object.values(state.logs).filter((l) => l.alcohol).length;

    const quests = state.quests.map((q) => `<div class="quest ${q.done ? "done" : ""}">
      <button class="ck" data-act="questtoggle" data-id="${q.id}">${q.done ? ic("check", 14, "#06251A", 3) : ""}</button>
      <span class="qt">${esc(q.text)}</span>
      <button class="del" data-act="questdel" data-id="${q.id}">&times;</button></div>`).join("");

    return `<div class="fadeup">
      <div class="card">
        <div class="cardhead"><span class="t">The 92-day grid</span><button class="iconbtn sm" data-act="sheet" data-sheet="scoring">${ic("info", 13, "#8A95A1")}</button></div>
        <div class="seasongrid">${cells}</div>
        <div class="legend">
          <span><i style="background:${TIER_COLOR.perfect}"></i> Perfect</span>
          <span><i style="background:${TIER_COLOR.banked}"></i> Banked</span>
          <span><i style="background:${TIER_COLOR.solid}"></i> Solid</span>
          <span><i style="background:${TIER_COLOR.light}"></i> Light</span>
          <span><i style="background:rgba(255,255,255,0.04)"></i> No data</span></div>
      </div>
      <div class="card glow" style="--accent:#A3E635">
        <div class="cardhead"><span class="t" style="display:flex;align-items:center;gap:8px">${ic("trophy", 16, "#A3E635")} Records</span></div>
        <div class="records">
          <div class="record"><div class="k">Days banked</div><div class="v"><b>${banked}</b></div></div>
          <div class="record"><div class="k">Longest run</div><div class="v"><b>${best}</b><small>days</small></div></div>
          <div class="record"><div class="k">Perfect days</div><div class="v"><b>${perfect}</b></div></div>
          <div class="record"><div class="k">AI hours</div><div class="v"><b style="color:var(--disc)">${aiTotal}</b><small>h</small></div></div>
        </div>
      </div>
      <div class="card glow" style="--accent:#A78BFA">
        <div class="cardhead"><span class="t" style="display:flex;align-items:center;gap:8px">${ic("sparkles", 15, "#A78BFA")} Winter quests</span></div>
        ${quests || '<p class="hint" style="margin-bottom:10px">No quests yet. Add a season goal below.</p>'}
        <div class="questadd"><input id="questInput" type="text" placeholder="Add a season goal…" /><button data-act="addquest">Add</button></div>
      </div>
      <div class="card glow ledger" style="--accent:#F87171">
        <div class="cardhead"><span class="t" style="display:flex;align-items:center;gap:8px">${ic("wine", 15, "#F87171")} Debt ledger</span></div>
        <div style="display:flex;align-items:baseline;gap:8px"><b style="color:${debt ? "#F87171" : "#34D399"}">${debt}</b><span class="meta">drinking day${debt !== 1 ? "s" : ""} this season</span></div>
        <div class="note">${debt === 0 ? "Clean ledger. Keep it that way." : "Each one extends the gap to target. Work it off."}</div>
      </div>
    </div>`;
  }

  /* ----------------------------- SHEETS ----------------------------- */
  function scoringSheet() {
    const tiers = [
      ["Perfect", TIER_COLOR.perfect, "All 4 core + supplements + an AI hour"],
      ["Banked", TIER_COLOR.banked, "All 4 core: weigh-in, ≤1,800 cal, 165g protein, 10k steps"],
      ["Solid", TIER_COLOR.solid, "3 of 4 core hit — still counts, no shame"],
      ["Light", TIER_COLOR.light, "1–2 core hit"],
      ["No data", "rgba(255,255,255,0.1)", "Nothing logged that day"],
    ].map(([t, c, d]) => `<div class="tierrow"><i style="background:${c}"></i><div><b>${t}</b><span>${d}</span></div></div>`).join("");
    const bands = [["80+", "#34D399", "Dialled in"], ["60–79", "#A3E635", "On track"], ["40–59", "#FBBF24", "Slipping"], ["<40", "#F87171", "Recover"]]
      .map(([r, c, l]) => `<div class="b" style="background:${c}18;border:1px solid ${c}44"><b style="color:${c}">${r}</b><span>${l}</span></div>`).join("");
    return sheet("How scoring works", "info", `
      <div class="secttl">Day tiers</div>${tiers}
      <div class="divider"></div>
      <div class="secttl">Season Form</div>
      <p>A rolling 10-day weighted score (0–100) of how completely you hit each day. It is deliberately <b style="color:#fff">not a streak</b> — one bad day dents it, a good week pulls it back, and you can never fully break it. The number is your current momentum, not your worst moment.</p>
      <div class="formbands">${bands}</div>`);
  }
  function remindersSheet() {
    const r = state.reminders;
    const perm = typeof Notification !== "undefined" ? Notification.permission : "unsupported";
    const rows = [["Morning weigh-in", "weighIn", "scale"], ["Evening log nudge", "evening", "bell"], ["AI learning block", "ai", "cap"]]
      .map(([lbl, key, icn]) => `<div class="setrow">${ic(icn, 16, "#A78BFA")}<span class="lbl">${lbl}</span><input type="time" value="${r[key]}" data-timekey="${key}" /></div>`).join("");
    const btn = perm === "granted" ? '<button class="bigbtn ghost">✓ Notifications enabled</button>'
      : perm === "unsupported" ? '<button class="bigbtn ghost">Notifications need the installed app</button>'
      : '<button class="bigbtn primary" data-act="enablenotif">Enable notifications</button>';
    const note = (perm === "denied" || perm === "unsupported")
      ? "Add the app to your home screen first, then enable. On iPhone, scheduled reminders only work from the installed app."
      : "Set the times you want a nudge. These fire from the installed home-screen app.";
    return sheet("Reminders", "bell", `${btn}<p class="hint" style="margin:0 0 16px">${note}</p>${rows}`);
  }
  function settingsSheet() {
    return sheet("Settings", "gear", `
      <div class="setrow"><span class="lbl">Season start</span><input type="date" value="${state.seasonStart}" data-seasonstart /></div>
      <div class="divider"></div>
      <button class="bigbtn ghost" data-act="export">${ic("download", 15, "#C4CCD4")} Export data (backup)</button>
      <label class="bigbtn ghost" style="display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer">${ic("upload", 15, "#C4CCD4")} Import data<input type="file" accept="application/json" data-import style="display:none"/></label>
      <div class="divider"></div>
      <button class="bigbtn danger" data-act="reset">Reset season (clears all logs)</button>`);
  }
  function sheet(title, icon, inner) {
    return `<div class="sheet-bg" data-act="closesheet"><div class="sheet" data-stop>
      <div class="head"><span class="t">${ic(icon, 17, "#A3E635")} ${title}</span><button class="iconbtn sm" data-act="closesheet">${ic("x", 15, "#C4CCD4")}</button></div>
      ${inner}</div></div>`;
  }

  /* ----------------------------- RENDER ----------------------------- */
  function header() {
    const todayStr = fmt(today0()); const dn = dayNumOf(todayStr);
    const dnClamp = Math.max(1, Math.min(dn, SEASON_LENGTH));
    const left = Math.max(0, SEASON_LENGTH - dnClamp + 1);
    return `<div class="topbar">
      <div><p class="eyebrow">Winter Cut · Season</p>
        <div class="clock"><b>${left}</b><span>days to go</span></div>
        <div class="subtle">Day ${dnClamp} of ${SEASON_LENGTH}</div></div>
      <div class="hbtns">
        <button class="iconbtn" data-act="sheet" data-sheet="reminders">${ic("bell", 16, state.reminders.enabled ? "#A3E635" : "#8A95A1")}${state.reminders.enabled ? '<span class="dot-on"></span>' : ""}</button>
        <button class="iconbtn" data-act="sheet" data-sheet="settings">${ic("gear", 16, "#8A95A1")}</button>
      </div></div>
      <div class="seasonbar"><i style="width:${(dnClamp / SEASON_LENGTH) * 100}%"></i></div>`;
  }
  function daySwitch() {
    const todayStr = fmt(today0()); const isToday = ui.sel === todayStr;
    const prevDis = new Date(ui.sel) <= new Date(state.seasonStart);
    const nextDis = ui.sel >= todayStr;
    const dnSel = dayNumOf(ui.sel);
    return `<div class="dayswitch ${isToday ? "" : "back"}">
      <button class="mini-icon" data-act="daystep" data-delta="-1" ${prevDis ? "disabled" : ""}>${ic("chevL", 16, "#C4CCD4")}</button>
      <div class="lbl"><b>${isToday ? "Today" : niceDate(ui.sel)}</b><span>${isToday ? "Day " + dnSel : "Backfilling · Day " + dnSel}</span></div>
      <button class="mini-icon" data-act="daystep" data-delta="1" ${nextDis ? "disabled" : ""}>${ic("chevR", 16, "#C4CCD4")}</button>
    </div>`;
  }
  function tabbar() {
    const tabs = [["today", "Today", "sparkles"], ["habits", "Habits", "grid"], ["trend", "Trend", "trenddown"], ["season", "Season", "calendar"]];
    return `<div class="tabbar">${tabs.map(([id, lbl, icn]) => `<button class="tab ${ui.tab === id ? "active" : ""}" data-act="tab" data-tab="${id}">${ic(icn, 18, "currentColor", ui.tab === id ? 2.4 : 1.8)}<span>${lbl}</span></button>`).join("")}</div>`;
  }

  function render() {
    const y = window.scrollY;
    let content = "";
    if (ui.tab === "today") content = daySwitch() + todayTab();
    else if (ui.tab === "habits") content = habitsTab();
    else if (ui.tab === "trend") content = trendTab();
    else content = seasonTab();
    let sheetHTML = "";
    if (ui.sheet === "scoring") sheetHTML = scoringSheet();
    else if (ui.sheet === "reminders") sheetHTML = remindersSheet();
    else if (ui.sheet === "settings") sheetHTML = settingsSheet();
    document.getElementById("app").innerHTML = `<div class="wrap">${header()}${content}</div>${tabbar()}${sheetHTML}`;
    window.scrollTo(0, y);
  }

  /* ----------------------------- EVENTS ----------------------------- */
  function clampSel() {
    const todayStr = fmt(today0());
    if (ui.sel < state.seasonStart) ui.sel = state.seasonStart;
    if (ui.sel > todayStr) ui.sel = todayStr;
  }
  function onClick(e) {
    const t = e.target.closest("[data-act]"); if (!t) return;
    const a = t.dataset.act;
    if (a === "tab") { ui.tab = t.dataset.tab; buzz(); return render(); }
    if (a === "daystep") { const d = +t.dataset.delta; const nd = fmt(addDays(new Date(ui.sel), d)); const todayStr = fmt(today0()); if (nd >= state.seasonStart && nd <= todayStr) { ui.sel = nd; buzz(); render(); } return; }
    if (a === "step") { const f = t.dataset.field; const cur = logFor(ui.sel)[f] || 0; setLog({ [f]: Math.max(0, cur + (+t.dataset.delta)) }); buzz(); return; }
    if (a === "setval") { setLog({ [t.dataset.field]: +t.dataset.val }); buzz(); return; }
    if (a === "toggle") { const f = t.dataset.field; const v = !logFor(ui.sel)[f]; buzz(v ? 14 : 6); setLog({ [f]: v }); return; }
    if (a === "aiadd") { const cur = logFor(ui.sel).aiHours || 0; setLog({ aiHours: Math.max(0, round1(cur + (+t.dataset.delta))) }); buzz(); return; }
    if (a === "bank") { setLog({ banked: true }); buzz(40); ui.bankPulse = true; render(); setTimeout(() => { ui.bankPulse = false; render(); }, 900); return; }
    if (a === "sheet") { ui.sheet = t.dataset.sheet; buzz(); return render(); }
    if (a === "closesheet") { if (e.target.closest("[data-stop]") && !e.target.closest('[data-act="closesheet"]')) return; ui.sheet = null; return render(); }
    if (a === "dismissdirective") { ui.dismissDirective = true; buzz(); return render(); }
    if (a === "habit") { ui.habit = t.dataset.id; buzz(); return render(); }
    if (a === "mode") { ui.mode = t.dataset.mode; buzz(); return render(); }
    if (a === "enablenotif") { enableNotif(); return; }
    if (a === "export") { exportData(); return; }
    if (a === "reset") { if (confirm("Reset the season? This clears all logged days. Quests are kept.")) { state.logs = {}; save(); ui.sheet = null; render(); } return; }
    if (a === "addquest") { const inp = document.getElementById("questInput"); const v = (inp.value || "").trim(); if (v) { state.quests.push({ id: Date.now(), text: v, done: false }); save(); render(); } return; }
    if (a === "questtoggle") { const id = +t.dataset.id; const q = state.quests.find((x) => x.id === id); if (q) { q.done = !q.done; buzz(); save(); render(); } return; }
    if (a === "questdel") { const id = +t.dataset.id; state.quests = state.quests.filter((x) => x.id !== id); save(); render(); return; }
  }
  function onChange(e) {
    const el = e.target;
    if (el.dataset.changefield) { const f = el.dataset.changefield; const v = el.value === "" ? null : parseFloat(el.value); setLog({ [f]: v }); return; }
    if (el.dataset.timekey) { state.reminders[el.dataset.timekey] = el.value; save(); return; }
    if (el.hasAttribute("data-seasonstart")) { state.seasonStart = el.value; clampSel(); save(); render(); return; }
    if (el.hasAttribute("data-import")) { importData(el.files[0]); return; }
  }
  async function enableNotif() {
    try { const p = await Notification.requestPermission(); if (p === "granted") { state.reminders.enabled = true; save(); render(); new Notification("Reminders on", { body: "You'll get nudges to log your day." }); } else render(); }
    catch (e) { render(); }
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "winter-arc-backup.json"; a.click(); URL.revokeObjectURL(url);
  }
  function importData(file) {
    if (!file) return; const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); if (d && d.logs) { state = d; if (!state.reminders) state.reminders = defaultState().reminders; if (!state.quests) state.quests = []; clampSel(); save(); ui.sheet = null; render(); } else alert("That file doesn't look like a Winter Arc backup."); } catch (err) { alert("Could not read that file."); } };
    r.readAsText(file);
  }

  /* ----------------------------- INIT ----------------------------- */
  function init() {
    load();
    const todayStr = fmt(today0());
    let sel = todayStr; if (sel < state.seasonStart) sel = state.seasonStart; if (sel > seasonEnd()) sel = seasonEnd();
    ui = { tab: "today", sel, habit: "ai", mode: "day", sheet: null, bankPulse: false, dismissDirective: false };
    document.addEventListener("click", onClick);
    document.addEventListener("change", onChange);
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
