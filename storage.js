const STORAGE_KEYS = {
  habits: 'planner_habits',
  habitLogs: 'planner_habit_logs',
  events: 'planner_events',
  notes: 'planner_notes',
};

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function formatDateISO(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a, b) {
  return formatDateISO(a) === formatDateISO(b);
}

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(date) {
  const monday = getMondayOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function formatDisplayDate(iso) {
  const d = parseDateISO(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMonthYear(year, month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function getHabits() {
  return getStorage(STORAGE_KEYS.habits, []);
}

function saveHabits(habits) {
  return setStorage(STORAGE_KEYS.habits, habits);
}

function getHabitLogs() {
  return getStorage(STORAGE_KEYS.habitLogs, {});
}

function saveHabitLogs(logs) {
  return setStorage(STORAGE_KEYS.habitLogs, logs);
}

function getLogForDate(dateISO) {
  const logs = getHabitLogs();
  return logs[dateISO] || {};
}

function setLogForDate(dateISO, dayLog) {
  const logs = getHabitLogs();
  logs[dateISO] = dayLog;
  saveHabitLogs(logs);
}

function getEvents() {
  return getStorage(STORAGE_KEYS.events, []);
}

function saveEvents(events) {
  return setStorage(STORAGE_KEYS.events, events);
}

function getNotes() {
  return getStorage(STORAGE_KEYS.notes, {});
}

function saveNotes(notes) {
  return setStorage(STORAGE_KEYS.notes, notes);
}
