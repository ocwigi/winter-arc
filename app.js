const seasonStart = "2026-06-01";
const seasonEnd = "2026-08-31";
const bodyGoals = [
  {
    id: "weight",
    label: "Weight",
    start: 81,
    target: 75,
    unit: "kg",
    lowerIsBetter: true,
  },
  {
    id: "bodyFat",
    label: "Body fat",
    start: 22,
    target: 15,
    unit: "%",
    progressUnit: "percentage points",
    lowerIsBetter: true,
  },
];

const habits = [
  {
    id: "gym",
    name: "Gym",
    type: "check",
    target: "4 / week",
    helper: "Weekly target matters more than a perfect day.",
    weeklyTarget: 4,
  },
  {
    id: "sauna",
    name: "Sauna",
    type: "check",
    target: "3 / week",
    helper: "Recovery sessions for the winter base.",
    weeklyTarget: 3,
  },
  {
    id: "protein",
    name: "Protein",
    type: "min",
    target: "165g",
    helper: "Hit or beat the daily target.",
    goal: 165,
    unit: "g",
    quick: [120, 165, 190],
  },
  {
    id: "calories",
    name: "Calories",
    type: "max",
    target: "1800 or less",
    helper: "Green if you stay at or below the limit.",
    goal: 1800,
    unit: "cal",
    quick: [1600, 1800, 2200],
  },
  {
    id: "supplements",
    name: "Supplements",
    type: "check",
    target: "daily",
    helper: "Creatine, hair tablets, and the full stack.",
  },
  {
    id: "steps",
    name: "Steps",
    type: "min",
    target: "10,000 daily",
    helper: "Daily target counts, but weekly and monthly volume can rescue a lower day.",
    goal: 10000,
    unit: "steps",
    quick: [5000, 10000, 15000],
  },
  {
    id: "alcohol",
    name: "No alcohol",
    type: "check",
    target: "daily",
    helper: "Green for an alcohol-free day.",
  },
  {
    id: "weigh-in",
    name: "Weigh in",
    type: "check",
    target: "daily",
    helper: "Step on the scale and log that the check-in happened.",
  },
  {
    id: "ai-learning",
    name: "AI learning",
    type: "min",
    target: "60 min",
    helper: "Learning, building, prompting, or automating with AI.",
    goal: 60,
    unit: "min",
    quick: [15, 30, 60],
  },
  {
    id: "winter",
    name: "Winter win",
    type: "check",
    target: "daily",
    helper: "A flexible bonus for sleep, sunlight, stretching, or meal prep.",
  },
];

const storageKey = "winter-arc-habits-v2";
const legacyStorageKey = "winter-arc-habits-v1";
const state = loadState();
let selectedKey = clampDate(todayKey());

function makeLocalDate(key) {
  return new Date(`${key}T12:00:00`);
}

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateToKey(date) {
  return todayKey(date);
}

function clampDate(key) {
  if (key < seasonStart) return seasonStart;
  if (key > seasonEnd) return seasonEnd;
  return key;
}

function offsetKey(key, days) {
  const date = makeLocalDate(key);
  date.setDate(date.getDate() + days);
  return clampDate(dateToKey(date));
}

function daysBetween(startKey, endKey) {
  return Math.round((makeLocalDate(endKey) - makeLocalDate(startKey)) / 86400000);
}

function loadState() {
  try {
    const next = JSON.parse(localStorage.getItem(storageKey));
    if (next) return next;

    const legacy = JSON.parse(localStorage.getItem(legacyStorageKey));
    if (legacy) {
      localStorage.setItem(storageKey, JSON.stringify(legacy));
      return legacy;
    }
  } catch {
    return {};
  }
  return {};
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function getDay(key = selectedKey) {
  state[key] ||= {};
  return state[key];
}

function habitDone(habit, day = getDay()) {
  const value = day[habit.id];
  if (habit.id === "weigh-in") {
    return value === true || Number.isFinite(Number(day.weight)) || Number.isFinite(Number(day.bodyFat));
  }
  if (habit.type === "check") return value === true;
  const number = Number(value);
  if (!Number.isFinite(number) || value === "") return false;
  if (habit.type === "min") return number >= habit.goal;
  if (habit.type === "max") return number <= habit.goal;
  return false;
}

function rangeKeys(startKey, endKey) {
  const keys = [];
  const date = makeLocalDate(startKey);
  const end = makeLocalDate(endKey);
  while (date <= end) {
    keys.push(dateToKey(date));
    date.setDate(date.getDate() + 1);
  }
  return keys;
}

function weekRangeFor(key) {
  const date = makeLocalDate(key);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = makeLocalDate(key);
  start.setDate(start.getDate() + mondayOffset);
  const end = makeLocalDate(start);
  end.setDate(end.getDate() + 6);
  return {
    start: clampDate(dateToKey(start)),
    end: clampDate(dateToKey(end)),
  };
}

function monthRangeFor(key) {
  const date = makeLocalDate(key);
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
  return {
    start: clampDate(dateToKey(start)),
    end: clampDate(dateToKey(end)),
  };
}

function sumHabit(habitId, keys) {
  return keys.reduce((sum, key) => sum + (Number((state[key] || {})[habitId]) || 0), 0);
}

function countHabit(habitId, keys) {
  const habit = habits.find((item) => item.id === habitId);
  return keys.reduce((sum, key) => sum + (habit && habitDone(habit, state[key] || {}) ? 1 : 0), 0);
}

function latestValueBeforeOrOn(fieldId, key = selectedKey) {
  for (let cursor = key; cursor >= seasonStart; cursor = offsetKey(cursor, -1)) {
    const value = Number((state[cursor] || {})[fieldId]);
    if (Number.isFinite(value) && value > 0) {
      return { value, key: cursor };
    }
    if (cursor === seasonStart) break;
  }
  return null;
}

function goalProgress(goal, current) {
  const total = Math.abs(goal.start - goal.target);
  const moved = goal.lowerIsBetter ? goal.start - current : current - goal.start;
  return Math.max(0, Math.min(100, Math.round((moved / total) * 100)));
}

function completedDaysSoFar() {
  const today = todayKey();
  const end = today < seasonStart || selectedKey <= today ? selectedKey : clampDate(today);
  return rangeKeys(seasonStart, end);
}

function weekStatusForHabit(habit, key) {
  if (!habit.weeklyTarget) return null;

  const week = weekRangeFor(key);
  const weekKeys = rangeKeys(week.start, week.end);
  const doneKeys = weekKeys.filter((weekKey) => habitDone(habit, state[weekKey] || {}));
  const completeWeek = week.end < todayKey() || week.end === seasonEnd;

  if (doneKeys.includes(key)) return "done";
  if (!completeWeek || doneKeys.length >= habit.weeklyTarget) return "optional";

  const nonDonePastKeys = weekKeys.filter((weekKey) => weekKey <= todayKey() && !doneKeys.includes(weekKey));
  const shortfall = habit.weeklyTarget - doneKeys.length;
  const missedKeys = nonDonePastKeys.slice(-shortfall);
  return missedKeys.includes(key) ? "missed" : "optional";
}

function loggedSeries(fieldId) {
  return rangeKeys(seasonStart, seasonEnd)
    .map((key) => ({ key, value: Number((state[key] || {})[fieldId]) }))
    .filter((item) => Number.isFinite(item.value) && item.value > 0);
}

function renderHabits() {
  const list = document.querySelector("#habitList");
  const day = getDay();
  list.innerHTML = "";

  habits.forEach((habit) => {
    const done = habitDone(habit, day);
    const card = document.createElement("article");
    card.className = `habit-card ${done ? "good" : "bad"}`;

    const toggle = document.createElement("button");
    toggle.className = "habit-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", `Toggle ${habit.name}`);
    toggle.textContent = done ? "OK" : "!";
    toggle.addEventListener("click", () => toggleHabit(habit));

    const main = document.createElement("div");
    main.className = "habit-main";

    const titleRow = document.createElement("div");
    titleRow.className = "habit-title-row";
    titleRow.innerHTML = `<h3 class="habit-title">${habit.name}</h3><span class="habit-target">${habit.target}</span>`;

    const sub = document.createElement("p");
    sub.className = "habit-sub";
    sub.textContent = habit.helper;

    main.append(titleRow, sub);

    if (habit.type !== "check") {
      const inputRow = document.createElement("div");
      inputRow.className = "habit-input-row";

      const input = document.createElement("input");
      input.inputMode = "numeric";
      input.pattern = "[0-9]*";
      input.placeholder = `${formatNumber(habit.goal)} ${habit.unit}`;
      input.value = day[habit.id] ?? "";
      input.setAttribute("aria-label", habit.name);
      input.addEventListener("input", () => {
        const clean = input.value.replace(/[^0-9]/g, "");
        input.value = clean;
        day[habit.id] = clean ? Number(clean) : "";
        saveState();
        renderAll();
      });

      const quickButtons = document.createElement("div");
      quickButtons.className = "quick-buttons";
      habit.quick.forEach((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = formatCompact(value);
        button.addEventListener("click", () => {
          day[habit.id] = value;
          saveState();
          renderAll();
        });
        quickButtons.append(button);
      });

      inputRow.append(input, quickButtons);
      main.append(inputRow);
    }

    card.append(toggle, main);
    list.append(card);
  });
}

function toggleHabit(habit) {
  const day = getDay();
  if (habit.type === "check") {
    day[habit.id] = !day[habit.id];
  } else if (habitDone(habit, day)) {
    day[habit.id] = "";
  } else {
    day[habit.id] = habit.goal;
  }
  saveState();
  renderAll();
}

function renderSeason() {
  const totalDays = daysBetween(seasonStart, seasonEnd) + 1;
  const dayNumber = daysBetween(seasonStart, selectedKey) + 1;
  const percent = Math.round((dayNumber / totalDays) * 100);

  document.querySelector("#seasonTitle").textContent = `Day ${dayNumber} of ${totalDays}`;
  document.querySelector("#seasonBar").style.width = `${percent}%`;
  document.querySelector("#seasonCopy").textContent = `${percent}% of winter mapped. The board runs June 1 to August 31.`;
}

function renderDateControls() {
  const picker = document.querySelector("#datePicker");
  picker.value = selectedKey;

  document.querySelector("#prevDayButton").disabled = selectedKey === seasonStart;
  document.querySelector("#nextDayButton").disabled = selectedKey === seasonEnd;
}

function renderScore() {
  const day = getDay();
  const total = habits.length;
  const complete = habits.filter((habit) => habitDone(habit, day)).length;
  const score = Math.round((complete / total) * 100);
  const selectedDate = makeLocalDate(selectedKey);
  const isToday = selectedKey === clampDate(todayKey());

  document.querySelector("#scoreValue").textContent = `${score}%`;
  document.querySelector("#greenCount").textContent = `${complete}/${total}`;
  document.querySelector("#scoreRing").style.background = `conic-gradient(var(--green) ${score * 3.6}deg, var(--line) 0deg)`;
  document.querySelector("#dateLabel").textContent = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const title = document.querySelector("#statusTitle");
  const copy = document.querySelector("#statusCopy");
  if (!isToday) {
    title.textContent = "Backfill mode.";
    copy.textContent = "Update this day honestly. The weekly and monthly totals will recalculate.";
  } else if (score === 100) {
    title.textContent = "Perfect day banked.";
    copy.textContent = "That is a spring-you deposit. Lock it in.";
  } else if (score >= 70) {
    title.textContent = "You are winning today.";
    copy.textContent = "A couple of red boxes left. Keep the board moving.";
  } else if (score >= 35) {
    title.textContent = "Good start, keep stacking.";
    copy.textContent = "Turn one red box green and the day changes shape.";
  } else {
    title.textContent = "Start the day clean.";
    copy.textContent = "Tap each habit as you complete it. Red means it still needs attention.";
  }
}

function renderBodyGoals() {
  const day = getDay();
  const daysLeft = Math.max(0, daysBetween(selectedKey, seasonEnd));
  document.querySelector("#daysRemaining").textContent = `${daysLeft} days left`;

  const weightInput = document.querySelector("#weightInput");
  const bodyFatInput = document.querySelector("#bodyFatInput");
  weightInput.value = day.weight ?? "";
  bodyFatInput.value = day.bodyFat ?? "";

  const goalsWrap = document.querySelector("#bodyGoals");
  goalsWrap.innerHTML = "";

  bodyGoals.forEach((goal) => {
    const latest = latestValueBeforeOrOn(goal.id);
    const current = latest?.value ?? goal.start;
    const percent = goalProgress(goal, current);
    const remaining = Math.max(0, Math.abs(current - goal.target));
    const moved = Math.max(0, Math.abs(goal.start - current));
    const total = Math.abs(goal.start - goal.target);
    const progressUnit = goal.progressUnit || goal.unit;
    const movementLine = goal.id === "bodyFat"
      ? `${formatDecimal(moved)} of ${formatDecimal(total)} ${progressUnit} done. ${formatDecimal(remaining)} ${progressUnit} to go.`
      : `${formatDecimal(moved)} of ${formatDecimal(total)}${goal.unit} done. ${formatDecimal(remaining)}${goal.unit} to go.`;
    const card = document.createElement("article");
    card.className = `body-goal-card ${percent >= 100 ? "good" : "bad"}`;
    card.innerHTML = `
      <div class="volume-top">
        <h3>${goal.label}</h3>
        <span>${percent}%</span>
      </div>
      <div class="body-stat-row">
        <strong>${formatDecimal(current)}${goal.unit}</strong>
        <span>target ${formatDecimal(goal.target)}${goal.unit}</span>
      </div>
      <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width: ${percent}%"></div></div>
      <p>${movementLine}</p>
      <p class="body-note">Latest: ${latest ? prettyShortDate(latest.key) : "starting estimate"}</p>
    `;
    goalsWrap.append(card);
  });

  renderBodyTrend();
}

function renderBodyTrend() {
  const chart = document.querySelector("#bodyTrend");
  const width = 320;
  const height = 150;
  const pad = 20;
  const series = bodyGoals.map((goal) => ({
    ...goal,
    values: loggedSeries(goal.id),
  }));
  const allValues = series.flatMap((item) => item.values.map((point) => point.value).concat([item.start, item.target]));

  if (!allValues.length) {
    chart.innerHTML = `<p class="empty-chart">Log weight or body fat to draw your winter trend.</p>`;
    return;
  }

  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const span = Math.max(1, max - min);
  const xFor = (key) => pad + (daysBetween(seasonStart, key) / daysBetween(seasonStart, seasonEnd)) * (width - pad * 2);
  const yFor = (value) => height - pad - ((value - min) / span) * (height - pad * 2);
  const colors = { weight: "#2c6fbb", bodyFat: "#1f9d62" };

  const paths = series.map((item) => {
    const points = item.values.map((point) => `${xFor(point.key)},${yFor(point.value)}`);
    const path = points.length > 1 ? `<polyline points="${points.join(" ")}" class="trend-line ${item.id}" />` : "";
    const dots = item.values.map((point) => `<circle cx="${xFor(point.key)}" cy="${yFor(point.value)}" r="3.5" fill="${colors[item.id]}" />`).join("");
    const targetY = yFor(item.target);
    return `
      <line x1="${pad}" x2="${width - pad}" y1="${targetY}" y2="${targetY}" class="target-line" />
      ${path}
      ${dots}
    `;
  }).join("");

  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Weight and body fat trend">
      <rect x="0" y="0" width="${width}" height="${height}" rx="8" class="chart-bg"></rect>
      <line x1="${pad}" x2="${width - pad}" y1="${height - pad}" y2="${height - pad}" class="axis-line"></line>
      ${paths}
    </svg>
    <div class="trend-legend">
      <span><i class="trend-key weight"></i>Weight</span>
      <span><i class="trend-key bodyFat"></i>Body fat</span>
      <span><i class="trend-key target"></i>Target</span>
    </div>
  `;
}

function renderPaceScores() {
  const grid = document.querySelector("#paceGrid");
  const keys = completedDaysSoFar();
  const elapsedDays = Math.max(1, keys.length);
  const weeklySteps = sumHabit("steps", rangeKeys(weekRangeFor(selectedKey).start, weekRangeFor(selectedKey).end));
  const monthSteps = sumHabit("steps", rangeKeys(monthRangeFor(selectedKey).start, monthRangeFor(selectedKey).end));

  const cards = [
    {
      label: "Gym pace",
      actual: countHabit("gym", keys),
      expected: (elapsedDays / 7) * 4,
      detail: "4 sessions per week",
    },
    {
      label: "Sauna pace",
      actual: countHabit("sauna", keys),
      expected: (elapsedDays / 7) * 3,
      detail: "3 sessions per week",
    },
    {
      label: "Alcohol-free pace",
      actual: countHabit("alcohol", keys),
      expected: elapsedDays,
      detail: "daily green boxes",
    },
    {
      label: "AI pace",
      actual: sumHabit("ai-learning", keys),
      expected: elapsedDays * 60,
      detail: "60 minutes per day",
    },
    {
      label: "Weekly steps",
      actual: weeklySteps,
      expected: 70000,
      detail: "current selected week",
    },
    {
      label: "Monthly steps",
      actual: monthSteps,
      expected: 300000,
      detail: "current selected month",
    },
  ];

  grid.innerHTML = "";
  cards.forEach((card) => {
    const score = Math.max(0, Math.min(150, Math.round((card.actual / card.expected) * 100)));
    const capped = Math.min(100, score);
    const article = document.createElement("article");
    article.className = `pace-card ${score >= 100 ? "good" : score >= 70 ? "watch" : "bad"}`;
    article.innerHTML = `
      <div class="pace-top">
        <h3>${card.label}</h3>
        <strong>${score}%</strong>
      </div>
      <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width: ${capped}%"></div></div>
      <p>${formatNumber(Math.round(card.actual))} actual vs ${formatNumber(Math.round(card.expected))} pace. ${card.detail}.</p>
    `;
    grid.append(article);
  });
}

function questCard({ title, subtitle, percent, type, value }) {
  const capped = Math.max(0, Math.min(100, Math.round(percent)));
  const visual = questVisual(type, capped);
  return `
    <article class="quest-card ${capped >= 100 ? "complete" : ""}">
      <div class="quest-top">
        <div>
          <h3>${title}</h3>
          <p>${subtitle}</p>
        </div>
        <strong>${value || `${capped}%`}</strong>
      </div>
      ${visual}
    </article>
  `;
}

function questVisual(type, percent) {
  if (type === "mountain") {
    const climberX = 40 + percent * 1.29;
    const climberY = 90 - percent * 0.64;
    return `
      <div class="mountain-quest" style="--progress: ${percent}%">
        <svg viewBox="0 0 220 104" aria-hidden="true">
          <path class="mountain-sky" d="M0 104V0h220v104z"></path>
          <path class="mountain-back" d="M8 100 72 24l44 52 24-28 72 52z"></path>
          <path class="mountain-front" d="M26 100 110 8l84 92z"></path>
          <path class="mountain-snow" d="m110 8 18 31-18-8-18 8z"></path>
          <path class="mountain-route" d="M40 90 C72 80, 70 64, 101 58 S134 36, 169 26"></path>
          <circle class="mountain-climber" cx="${climberX}" cy="${climberY}" r="6"></circle>
        </svg>
      </div>
    `;
  }

  if (type === "stack") {
    return `
      <div class="stack-quest">
        ${[25, 50, 75, 100].map((level) => `<span class="${percent >= level ? "filled" : ""}"></span>`).join("")}
      </div>
    `;
  }

  if (type === "steam") {
    return `
      <div class="steam-quest">
        ${[34, 67, 100].map((level) => `<span class="${percent >= level ? "filled" : ""}"></span>`).join("")}
      </div>
    `;
  }

  if (type === "dial") {
    return `<div class="quest-dial" style="--dial: ${percent * 3.6}deg"><span>${percent}%</span></div>`;
  }

  return `<div class="quest-bar"><span style="width: ${percent}%"></span></div>`;
}

function renderQuests() {
  const week = weekRangeFor(selectedKey);
  const weekKeys = rangeKeys(week.start, week.end);
  const day = getDay();
  const weightLatest = latestValueBeforeOrOn("weight");
  const bodyFatLatest = latestValueBeforeOrOn("bodyFat");
  const weightPercent = goalProgress(bodyGoals[0], weightLatest?.value ?? bodyGoals[0].start);
  const bodyFatPercent = goalProgress(bodyGoals[1], bodyFatLatest?.value ?? bodyGoals[1].start);

  const quests = [
    {
      title: "Step mountain",
      subtitle: `${formatNumber(sumHabit("steps", weekKeys))} / 70,000 this week`,
      percent: (sumHabit("steps", weekKeys) / 70000) * 100,
      type: "mountain",
    },
    {
      title: "Strength stack",
      subtitle: `${countHabit("gym", weekKeys)} / 4 gym sessions`,
      percent: (countHabit("gym", weekKeys) / 4) * 100,
      type: "stack",
    },
    {
      title: "Sauna steam",
      subtitle: `${countHabit("sauna", weekKeys)} / 3 recovery sessions`,
      percent: (countHabit("sauna", weekKeys) / 3) * 100,
      type: "steam",
    },
    {
      title: "Protein tank",
      subtitle: day.protein ? `${day.protein}g / 165g today` : "Log today's protein",
      percent: ((Number(day.protein) || 0) / 165) * 100,
      type: "bar",
    },
    {
      title: "Calorie guardrail",
      subtitle: day.calories ? `${day.calories} / 1,800 today` : "Stay under the line",
      percent: habitDone(habits.find((habit) => habit.id === "calories"), day) ? 100 : 0,
      type: "dial",
      value: habitDone(habits.find((habit) => habit.id === "calories"), day) ? "Clear" : "Watch",
    },
    {
      title: "Body descent",
      subtitle: `Weight ${weightPercent}%, body fat ${bodyFatPercent}%`,
      percent: (weightPercent + bodyFatPercent) / 2,
      type: "mountain",
    },
    {
      title: "Clear morning",
      subtitle: habitDone(habits.find((habit) => habit.id === "alcohol"), day) ? "Alcohol-free day" : "Keep it clean",
      percent: habitDone(habits.find((habit) => habit.id === "alcohol"), day) ? 100 : 0,
      type: "dial",
      value: habitDone(habits.find((habit) => habit.id === "alcohol"), day) ? "Done" : "Open",
    },
    {
      title: "AI hour",
      subtitle: `${Number(day["ai-learning"]) || 0} / 60 minutes today`,
      percent: ((Number(day["ai-learning"]) || 0) / 60) * 100,
      type: "bar",
    },
  ];

  document.querySelector("#questGrid").innerHTML = quests.map(questCard).join("");
}

function renderWeeklyStats() {
  const week = weekRangeFor(selectedKey);
  const keys = rangeKeys(week.start, week.end);
  const points = keys.reduce((sum, key) => {
    const day = state[key] || {};
    return sum + habits.filter((habit) => habitDone(habit, day)).length;
  }, 0);
  document.querySelector("#weekScore").textContent = points;

  let streak = 0;
  for (let key = clampDate(todayKey()); key >= seasonStart; key = offsetKey(key, -1)) {
    const day = state[key] || {};
    const score = habits.filter((habit) => habitDone(habit, day)).length / habits.length;
    if (score < 0.75) break;
    streak += 1;
    if (key === seasonStart) break;
  }
  document.querySelector("#streakCount").textContent = streak;
}

function renderVolumeTargets() {
  const week = weekRangeFor(selectedKey);
  const month = monthRangeFor(selectedKey);
  const weekKeys = rangeKeys(week.start, week.end);
  const monthKeys = rangeKeys(month.start, month.end);

  const weeklySteps = sumHabit("steps", weekKeys);
  const monthlySteps = sumHabit("steps", monthKeys);
  const weeklyGym = countHabit("gym", weekKeys);
  const weeklySauna = countHabit("sauna", weekKeys);
  const weeklyAi = sumHabit("ai-learning", weekKeys);
  const monthlyAi = sumHabit("ai-learning", monthKeys);

  const targets = [
    { label: "Steps this week", value: weeklySteps, target: 70000, unit: "steps" },
    { label: "Steps this month", value: monthlySteps, target: 300000, unit: "steps" },
    { label: "Gym this week", value: weeklyGym, target: 4, unit: "sessions" },
    { label: "Sauna this week", value: weeklySauna, target: 3, unit: "sessions" },
    { label: "AI this week", value: weeklyAi, target: 420, unit: "min" },
    { label: "AI this month", value: monthlyAi, target: 1800, unit: "min" },
  ];

  document.querySelector("#volumeWindow").textContent = `${prettyShortDate(week.start)} - ${prettyShortDate(week.end)}`;
  const grid = document.querySelector("#volumeGrid");
  grid.innerHTML = "";

  targets.forEach((target) => {
    const percent = Math.min(100, Math.round((target.value / target.target) * 100));
    const card = document.createElement("article");
    card.className = `volume-card ${percent >= 100 ? "good" : "bad"}`;
    card.innerHTML = `
      <div class="volume-top">
        <h3>${target.label}</h3>
        <span>${percent}%</span>
      </div>
      <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width: ${percent}%"></div></div>
      <p>${formatNumber(target.value)} / ${formatNumber(target.target)} ${target.unit}</p>
    `;
    grid.append(card);
  });
}

function renderHabitMatrix() {
  const matrix = document.querySelector("#habitMatrix");
  const keys = rangeKeys(seasonStart, seasonEnd);
  const currentKey = todayKey();
  const months = [
    { label: "Jun", start: "2026-06-01", end: "2026-06-30" },
    { label: "Jul", start: "2026-07-01", end: "2026-07-31" },
    { label: "Aug", start: "2026-08-01", end: "2026-08-31" },
  ];
  matrix.innerHTML = "";

  habits.forEach((habit) => {
    const row = document.createElement("article");
    row.className = "matrix-row";

    const complete = keys.filter((key) => habitDone(habit, state[key] || {})).length;
    const seasonTarget = habit.weeklyTarget
      ? Math.round((keys.length / 7) * habit.weeklyTarget)
      : keys.length;
    const label = document.createElement("div");
    label.className = "matrix-label";
    label.innerHTML = `<strong>${habit.name}</strong><span>${complete}/${seasonTarget}</span>`;

    const monthsWrap = document.createElement("div");
    monthsWrap.className = "matrix-months";

    months.forEach((month) => {
      const monthRow = document.createElement("div");
      monthRow.className = "matrix-month-row";

      const monthLabel = document.createElement("span");
      monthLabel.className = "matrix-month-label";
      monthLabel.textContent = month.label;

      const dots = document.createElement("div");
      dots.className = "matrix-dots";

      rangeKeys(month.start, month.end).forEach((key) => {
        const done = habitDone(habit, state[key] || {});
        const isFuture = key > currentKey;
        const weeklyStatus = weekStatusForHabit(habit, key);
        const status = isFuture ? "future" : weeklyStatus || (done ? "done" : "missed");
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = `matrix-dot ${status}${key === selectedKey ? " selected" : ""}`;
        dot.setAttribute("aria-label", `${habit.name} on ${prettyShortDate(key)}: ${status}`);
        dot.title = `${habit.name} on ${prettyShortDate(key)}: ${status}`;
        dot.addEventListener("click", () => {
          selectedKey = key;
          renderAll();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
        dots.append(dot);
      });

      monthRow.append(monthLabel, dots);
      monthsWrap.append(monthRow);
    });

    row.append(label, monthsWrap);
    matrix.append(row);
  });
}

function renderHeatmap() {
  const board = document.querySelector("#heatmap");
  board.innerHTML = "";

  rangeKeys(seasonStart, seasonEnd).forEach((key) => {
    const day = state[key] || {};
    const complete = habits.filter((habit) => habitDone(habit, day)).length;
    const score = Math.round((complete / habits.length) * 100);
    const cell = document.createElement("button");
    const isSelected = key === selectedKey;
    const isFuture = key > todayKey();
    const level = score >= 80 ? "great" : score >= 50 ? "good" : score > 0 ? "some" : "empty";
    cell.type = "button";
    cell.className = `season-cell ${level}${isSelected ? " selected" : ""}${isFuture ? " future" : ""}`;
    cell.textContent = String(makeLocalDate(key).getDate());
    cell.title = `${prettyShortDate(key)}: ${score}%`;
    cell.addEventListener("click", () => {
      selectedKey = key;
      renderAll();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    board.append(cell);
  });
}

function renderAll() {
  renderSeason();
  renderDateControls();
  renderHabits();
  renderScore();
  renderBodyGoals();
  renderPaceScores();
  renderQuests();
  renderWeeklyStats();
  renderVolumeTargets();
  renderHabitMatrix();
  renderHeatmap();
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function formatDecimal(value) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

function formatCompact(value) {
  if (value >= 1000 && value % 1000 !== 0) return `${(value / 1000).toFixed(1)}k`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}

function prettyShortDate(key) {
  return makeLocalDate(key).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

document.querySelector("#datePicker").addEventListener("change", (event) => {
  selectedKey = clampDate(event.target.value || todayKey());
  renderAll();
});

document.querySelector("#weightInput").addEventListener("input", (event) => {
  const value = Number(event.target.value);
  const day = getDay();
  day.weight = Number.isFinite(value) && event.target.value !== "" ? value : "";
  saveState();
  renderAll();
});

document.querySelector("#bodyFatInput").addEventListener("input", (event) => {
  const value = Number(event.target.value);
  const day = getDay();
  day.bodyFat = Number.isFinite(value) && event.target.value !== "" ? value : "";
  saveState();
  renderAll();
});

document.querySelector("#prevDayButton").addEventListener("click", () => {
  selectedKey = offsetKey(selectedKey, -1);
  renderAll();
});

document.querySelector("#nextDayButton").addEventListener("click", () => {
  selectedKey = offsetKey(selectedKey, 1);
  renderAll();
});

document.querySelector("#resetDayButton").addEventListener("click", () => {
  state[selectedKey] = {};
  saveState();
  renderAll();
});

document.querySelector("#exportButton").addEventListener("click", async () => {
  const payload = JSON.stringify(state, null, 2);
  try {
    await navigator.clipboard.writeText(payload);
    document.querySelector("#exportButton").textContent = "Copied";
    setTimeout(() => {
      document.querySelector("#exportButton").textContent = "Export";
    }, 1200);
  } catch {
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "winter-arc-habits.json";
    link.click();
    URL.revokeObjectURL(url);
  }
});

renderAll();
