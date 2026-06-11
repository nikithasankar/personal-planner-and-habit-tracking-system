const HABIT_COLORS = ['#B8E0F6', '#FFD4B8', '#D4C4F0', '#B8F0D4', '#F0E6B8', '#F0B8D4'];

const MOTIVATING_MESSAGES = [
  "You're on a {streak}-day streak! Keep going!",
  "Small steps every day — you've got this!",
  "Time for {name}! Your future self will thank you.",
  "Consistency beats perfection. Let's do {name}!",
  "{streak} days strong — don't break the chain!",
  "One habit at a time. Ready for {name}?",
  "You're building something great — {name} awaits!",
  "Show up for yourself today with {name}.",
  "Progress, not pressure. Time for {name}!",
  "Your {streak}-day streak is worth protecting!",
  "Believe in the process — {name} is calling!",
  "Every day counts. Let's complete {name}!",
  "You are capable. {name} — let's go!",
  "Momentum is on your side ({streak} days)!",
  "Make today count with {name}!",
];

let selectedHabitDate = formatDateISO(new Date());
let dismissedReminders = new Set();

function isHabitComplete(habit, dayLog) {
  const val = dayLog[habit.id];
  const type = habit.type || 'checkbox';
  if (type === 'checkbox') {
    return val === true;
  }
  const num = typeof val === 'number' ? val : 0;
  return num >= (habit.goalPerDay || 1);
}

function getHabitProgress(habit, dayLog) {
  if ((habit.type || 'checkbox') === 'checkbox') {
    return dayLog[habit.id] === true ? 100 : 0;
  }
  const val = typeof dayLog[habit.id] === 'number' ? dayLog[habit.id] : 0;
  const goal = habit.goalPerDay || 1;
  return Math.min(100, Math.round((val / goal) * 100));
}

function calculateStreak(habit, upToDate) {
  let streak = 0;
  let d = parseDateISO(upToDate);
  while (true) {
    const iso = formatDateISO(d);
    const dayLog = getLogForDate(iso);
    if (isHabitComplete(habit, dayLog)) {
      streak++;
      d = addDays(d, -1);
    } else {
      break;
    }
  }
  return streak;
}

function getTotalCompletions(habit) {
  const logs = getHabitLogs();
  let count = 0;
  for (const iso of Object.keys(logs)) {
    if (isHabitComplete(habit, logs[iso])) count++;
  }
  return count;
}

function getMotivatingMessage(habit, streak) {
  const idx = (habit.id.charCodeAt(0) + selectedHabitDate.charCodeAt(0)) % MOTIVATING_MESSAGES.length;
  return MOTIVATING_MESSAGES[idx]
    .replace(/\{name\}/g, habit.name)
    .replace(/\{streak\}/g, String(streak));
}

function drawPieChart(done, total) {
  const canvas = document.getElementById('habits-pie-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 48;
  const inner = 32;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (total === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2d35';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1d24';
    ctx.fill();
    return;
  }

  const doneAngle = (done / total) * Math.PI * 2;
  const start = -Math.PI / 2;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, start + Math.PI * 2);
  ctx.fillStyle = '#2a2d35';
  ctx.fill();

  if (done > 0) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, start + doneAngle);
    ctx.closePath();
    ctx.fillStyle = '#ff9500';
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1d24';
  ctx.fill();

  ctx.fillStyle = '#e8eaed';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const pct = total ? Math.round((done / total) * 100) : 0;
  ctx.fillText(`${pct}%`, cx, cy);
}

function renderDateStrip() {
  const strip = document.getElementById('habits-date-strip');
  if (!strip) return;
  const weekDates = getWeekDates(parseDateISO(selectedHabitDate));
  const todayISO = formatDateISO(new Date());

  strip.innerHTML = weekDates.map((d) => {
    const iso = formatDateISO(d);
    const isSelected = iso === selectedHabitDate;
    const isToday = iso === todayISO;
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    const dayNum = d.getDate();
    return `
      <button type="button" class="date-chip ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}"
              data-date="${iso}">
        <span class="chip-day">${dayName}</span>
        <span class="chip-num">${dayNum}</span>
      </button>`;
  }).join('');

  strip.querySelectorAll('.date-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedHabitDate = btn.dataset.date;
      renderHabits();
    });
  });
}

function renderHabitCard(habit, dayLog) {
  const complete = isHabitComplete(habit, dayLog);
  const progress = getHabitProgress(habit, dayLog);
  const streak = calculateStreak(habit, selectedHabitDate);
  const val = dayLog[habit.id];

  let progressHTML = '';
  if ((habit.type || 'checkbox') === 'checkbox') {
    progressHTML = `
      <label class="habit-check">
        <input type="checkbox" data-habit-id="${habit.id}" ${complete ? 'checked' : ''}>
        <span>${complete ? 'Done!' : 'Mark complete'}</span>
      </label>`;
  } else {
    const current = typeof val === 'number' ? val : 0;
    progressHTML = `
      <div class="habit-progress-wrap">
        <div class="habit-progress-bar">
          <div class="habit-progress-fill" style="width:${progress}%; background:${habit.color}"></div>
        </div>
        <span class="habit-progress-text">${current}/${habit.goalPerDay} ${habit.unit || ''}</span>
        <div class="habit-numeric-controls">
          <button type="button" class="btn-sm" data-action="dec" data-habit-id="${habit.id}">−</button>
          <button type="button" class="btn-sm" data-action="inc" data-habit-id="${habit.id}">+</button>
        </div>
      </div>`;
  }

  return `
    <article class="habit-card" data-habit-id="${habit.id}" style="--card-color: ${habit.color}">
      <div class="habit-card-top">
        <span class="habit-icon">${habit.icon || '✨'}</span>
        <div class="habit-info">
          <h3>${escapeHtml(habit.name)}</h3>
          <span class="habit-streak">🔥 ${streak} Day${streak !== 1 ? 's' : ''}</span>
        </div>
        <div class="habit-card-actions">
          <button type="button" class="btn-icon btn-edit-habit" data-id="${habit.id}" aria-label="Edit">✎</button>
          <button type="button" class="btn-icon btn-delete-habit" data-id="${habit.id}" aria-label="Delete">🗑</button>
        </div>
      </div>
      ${progressHTML}
    </article>`;
}

function renderWeeklyGrid(habits) {
  const grid = document.getElementById('weekly-grid');
  if (!grid) return;

  if (habits.length === 0) {
    grid.innerHTML = '<p class="empty-hint">Add habits to see weekly progress.</p>';
    return;
  }

  const weekDates = getWeekDates(parseDateISO(selectedHabitDate));
  const dayLabels = weekDates.map((d) =>
    d.toLocaleDateString(undefined, { weekday: 'narrow' })
  );

  let html = '<div class="wg-header"><span class="wg-label"></span>';
  dayLabels.forEach((l, i) => {
    html += `<span class="wg-day">${l}<small>${weekDates[i].getDate()}</small></span>`;
  });
  html += '</div>';

  habits.forEach((habit) => {
    html += `<div class="wg-row"><span class="wg-label" title="${escapeHtml(habit.name)}">${habit.icon} ${escapeHtml(habit.name)}</span>`;
    weekDates.forEach((d) => {
      const iso = formatDateISO(d);
      const dayLog = getLogForDate(iso);
      const done = isHabitComplete(habit, dayLog);
      html += `<span class="wg-cell ${done ? 'done' : ''}" style="${done ? `--dot-color:${habit.color}` : ''}"></span>`;
    });
    html += '</div>';
  });

  grid.innerHTML = html;
}

function updateStats(habits, dayLog) {
  const total = habits.length;
  const done = habits.filter((h) => isHabitComplete(h, dayLog)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  document.getElementById('completion-percent').textContent = `${pct}%`;

  let bestStreak = 0;
  let totalDone = 0;
  habits.forEach((h) => {
    const s = calculateStreak(h, selectedHabitDate);
    if (s > bestStreak) bestStreak = s;
    totalDone += getTotalCompletions(h);
  });

  document.getElementById('best-streak-stat').textContent = bestStreak;
  document.getElementById('total-done-stat').textContent = totalDone;
  drawPieChart(done, total);
}

function renderHabits() {
  renderDateStrip();
  const habits = getHabits();
  const dayLog = getLogForDate(selectedHabitDate);
  const list = document.getElementById('habits-list');

  if (habits.length === 0) {
    list.innerHTML = '<p class="empty-hint">No habits yet. Click "+ Add Habit" to get started!</p>';
  } else {
    list.innerHTML = habits.map((h) => renderHabitCard(h, dayLog)).join('');
    bindHabitCardEvents();
  }

  renderWeeklyGrid(habits);
  updateStats(habits, dayLog);
  checkReminders();
}

function bindHabitCardEvents() {
  document.querySelectorAll('.habit-check input').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      const id = e.target.dataset.habitId;
      const habit = getHabits().find((h) => h.id === id);
      if (!habit) return;
      const prevLog = getLogForDate(selectedHabitDate);
      const wasComplete = isHabitComplete(habit, prevLog);
      const dayLog = { ...prevLog };
      dayLog[id] = e.target.checked;
      const nowComplete = isHabitComplete(habit, dayLog);
      setLogForDate(selectedHabitDate, dayLog);
      let burst = null;
      if (!wasComplete && nowComplete) {
        const card = e.target.closest('.habit-card');
        if (card) {
          const r = card.getBoundingClientRect();
          burst = { x: r.left + r.width / 2, y: r.top + r.height / 2, id };
        }
      }
      renderHabits();
      if (burst) celebrateHabitComplete(burst.x, burst.y, burst.id);
    });
  });

  document.querySelectorAll('[data-action="inc"], [data-action="dec"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.habitId;
      const habit = getHabits().find((h) => h.id === id);
      if (!habit) return;
      const prevLog = getLogForDate(selectedHabitDate);
      const wasComplete = isHabitComplete(habit, prevLog);
      const dayLog = { ...prevLog };
      const current = typeof dayLog[id] === 'number' ? dayLog[id] : 0;
      const delta = btn.dataset.action === 'inc' ? 1 : -1;
      dayLog[id] = Math.max(0, current + delta);
      const nowComplete = isHabitComplete(habit, dayLog);
      setLogForDate(selectedHabitDate, dayLog);
      let burst = null;
      if (!wasComplete && nowComplete && delta > 0) {
        const card = btn.closest('.habit-card');
        if (card) {
          const r = card.getBoundingClientRect();
          burst = { x: r.left + r.width / 2, y: r.top + r.height / 2, id };
        }
      }
      renderHabits();
      if (burst) celebrateHabitComplete(burst.x, burst.y, burst.id);
    });
  });

  document.querySelectorAll('.btn-edit-habit').forEach((btn) => {
    btn.addEventListener('click', () => openHabitModal(btn.dataset.id));
  });

  document.querySelectorAll('.btn-delete-habit').forEach((btn) => {
    btn.addEventListener('click', () => deleteHabit(btn.dataset.id));
  });
}

function openHabitModal(habitId) {
  const modal = document.getElementById('habit-modal');
  const form = document.getElementById('habit-form');
  form.reset();

  if (habitId) {
    const habit = getHabits().find((h) => h.id === habitId);
    if (!habit) return;
    document.getElementById('habit-modal-title').textContent = 'Edit Habit';
    document.getElementById('habit-id').value = habit.id;
    document.getElementById('habit-name').value = habit.name;
    document.getElementById('habit-icon').value = habit.icon || '✨';
    document.getElementById('habit-color').value = habit.color;
    document.getElementById('habit-type').value = habit.type;
    document.getElementById('habit-goal').value = habit.goalPerDay || 1;
    document.getElementById('habit-unit').value = habit.unit || '';
    document.getElementById('habit-reminder').value = habit.reminderTime || '';
  } else {
    document.getElementById('habit-modal-title').textContent = 'Add Habit';
    document.getElementById('habit-id').value = '';
    document.getElementById('habit-icon').value = '✨';
  }

  toggleNumericFields();
  modal.showModal();
}

function toggleNumericFields() {
  const type = document.getElementById('habit-type').value;
  document.getElementById('numeric-fields').classList.toggle('hidden', type !== 'numeric');
}

function saveHabitFromForm(e) {
  e.preventDefault();
  const id = document.getElementById('habit-id').value;
  const type = document.getElementById('habit-type').value;
  const habit = {
    id: id || generateId(),
    name: document.getElementById('habit-name').value.trim(),
    icon: document.getElementById('habit-icon').value.trim() || '✨',
    color: document.getElementById('habit-color').value,
    type,
    goalPerDay: type === 'numeric' ? Number(document.getElementById('habit-goal').value) || 1 : 1,
    unit: type === 'numeric' ? document.getElementById('habit-unit').value.trim() : '',
    reminderTime: document.getElementById('habit-reminder').value || '',
    createdAt: id ? undefined : new Date().toISOString(),
  };

  let habits = getHabits();
  if (id) {
    habits = habits.map((h) => (h.id === id ? { ...h, ...habit, createdAt: h.createdAt } : h));
  } else {
    habits.push(habit);
  }
  saveHabits(habits);
  document.getElementById('habit-modal').close();
  renderHabits();
}

function deleteHabit(id) {
  const habit = getHabits().find((h) => h.id === id);
  if (!habit) return;
  if (!confirm(`Delete habit "${habit.name}"? This cannot be undone.`)) return;

  saveHabits(getHabits().filter((h) => h.id !== id));
  const logs = getHabitLogs();
  for (const iso of Object.keys(logs)) {
    delete logs[iso][id];
  }
  saveHabitLogs(logs);
  renderHabits();
}

function checkReminders() {
  const todayISO = formatDateISO(new Date());
  if (selectedHabitDate !== todayISO) {
    hideReminderBanner();
    return;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayLog = getLogForDate(todayISO);
  const habits = getHabits();

  for (const habit of habits) {
    if (!habit.reminderTime || isHabitComplete(habit, dayLog)) continue;
    const key = `${todayISO}-${habit.id}`;
    if (dismissedReminders.has(key)) continue;

    const [h, m] = habit.reminderTime.split(':').map(Number);
    const reminderMinutes = h * 60 + m;
    if (currentMinutes >= reminderMinutes) {
      const streak = calculateStreak(habit, todayISO);
      showReminderBanner(habit, streak, key);
      tryNotify(habit, streak);
      return;
    }
  }
  hideReminderBanner();
}

function showReminderBanner(habit, streak, key) {
  const banner = document.getElementById('reminder-banner');
  const text = document.getElementById('reminder-text');
  text.textContent = `${habit.icon} Time for ${habit.name} — ${getMotivatingMessage(habit, streak)}`;
  banner.dataset.dismissKey = key;
  banner.classList.remove('hidden');
}

function hideReminderBanner() {
  document.getElementById('reminder-banner').classList.add('hidden');
}

function tryNotify(habit, streak) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const key = `notified-${formatDateISO(new Date())}-${habit.id}`;
  if (sessionStorage.getItem(key)) return;
  new Notification(`Time for ${habit.name}`, {
    body: getMotivatingMessage(habit, streak),
  });
  sessionStorage.setItem(key, '1');
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function initHabits() {
  document.getElementById('add-habit-btn').addEventListener('click', () => openHabitModal(null));
  document.getElementById('habit-cancel-btn').addEventListener('click', () => {
    document.getElementById('habit-modal').close();
  });
  document.getElementById('habit-form').addEventListener('submit', saveHabitFromForm);
  document.getElementById('habit-type').addEventListener('change', toggleNumericFields);
  document.getElementById('reminder-dismiss').addEventListener('click', () => {
    const banner = document.getElementById('reminder-banner');
    if (banner.dataset.dismissKey) dismissedReminders.add(banner.dataset.dismissKey);
    hideReminderBanner();
  });

  requestNotificationPermission();
  renderHabits();
}
