let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let selectedDayISO = null;

function getEventsForDate(dateISO) {
  return getEvents().filter((e) => e.date === dateISO);
}

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const cells = [];
  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthLast - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ date: new Date(y, m, d), currentMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), currentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ date: new Date(y, m, d), currentMonth: false });
  }
  return cells;
}

function renderCalendar() {
  document.getElementById('cal-month-label').textContent = formatMonthYear(calYear, calMonth);
  const grid = document.getElementById('calendar-grid');
  const todayISO = formatDateISO(new Date());
  const cells = getMonthGrid(calYear, calMonth);
  const allEvents = getEvents();

  grid.innerHTML = cells.map(({ date, currentMonth }) => {
    const iso = formatDateISO(date);
    const isToday = iso === todayISO;
    const dayEvents = allEvents.filter((e) => e.date === iso);
    const visible = dayEvents.slice(0, 3);
    const overflow = dayEvents.length - 3;

    const pills = visible.map((e) =>
      `<span class="cal-event-pill" style="background:${e.color}" data-event-id="${e.id}" title="${escapeHtml(e.title)}">${escapeHtml(e.title)}</span>`
    ).join('');
    const more = overflow > 0 ? `<span class="cal-more">+${overflow} more</span>` : '';

    return `
      <button type="button" class="cal-cell ${currentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}"
              data-date="${iso}">
        <span class="cal-day-num">${date.getDate()}</span>
        <div class="cal-events">${pills}${more}</div>
      </button>`;
  }).join('');

  grid.querySelectorAll('.cal-cell').forEach((cell) => {
    cell.addEventListener('click', (e) => {
      if (e.target.classList.contains('cal-event-pill')) {
        openEventModal(e.target.dataset.eventId);
      } else {
        openDayPanel(cell.dataset.date);
      }
    });
  });

  grid.querySelectorAll('.cal-event-pill').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      openEventModal(pill.dataset.eventId);
    });
  });
}

function openDayPanel(dateISO) {
  selectedDayISO = dateISO;
  document.getElementById('day-panel-title').textContent = formatDisplayDate(dateISO);
  renderDayEventsList();
  document.getElementById('day-panel').showModal();
}

function renderDayEventsList() {
  const list = document.getElementById('day-events-list');
  const events = getEventsForDate(selectedDayISO).sort((a, b) => {
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  if (events.length === 0) {
    list.innerHTML = '<li class="empty-hint">No events for this day.</li>';
    return;
  }

  list.innerHTML = events.map((e) => {
    const timeStr = e.allDay ? 'All day' : `${e.startTime}${e.endTime ? ' – ' + e.endTime : ''}`;
    return `
      <li class="day-event-item" style="border-left-color:${e.color}">
        <button type="button" class="day-event-btn" data-event-id="${e.id}">
          <strong>${escapeHtml(e.title)}</strong>
          <span class="event-time">${timeStr}</span>
          ${e.description ? `<p class="event-desc">${escapeHtml(e.description)}</p>` : ''}
        </button>
      </li>`;
  }).join('');

  list.querySelectorAll('.day-event-btn').forEach((btn) => {
    btn.addEventListener('click', () => openEventModal(btn.dataset.eventId));
  });
}

function openEventModal(eventId) {
  const modal = document.getElementById('event-modal');
  const form = document.getElementById('event-form');
  form.reset();

  const deleteBtn = document.getElementById('event-delete-btn');

  if (eventId) {
    const event = getEvents().find((e) => e.id === eventId);
    if (!event) return;
    document.getElementById('event-modal-title').textContent = 'Edit Event';
    document.getElementById('event-id').value = event.id;
    document.getElementById('event-title').value = event.title;
    document.getElementById('event-date').value = event.date;
    document.getElementById('event-all-day').checked = event.allDay;
    document.getElementById('event-start').value = event.startTime || '09:00';
    document.getElementById('event-end').value = event.endTime || '10:00';
    document.getElementById('event-color').value = event.color;
    document.getElementById('event-description').value = event.description || '';
    deleteBtn.hidden = false;
  } else {
    document.getElementById('event-modal-title').textContent = 'Add Event';
    document.getElementById('event-id').value = '';
    document.getElementById('event-date').value = selectedDayISO || formatDateISO(new Date());
    deleteBtn.hidden = true;
  }

  toggleEventTimeFields();
  modal.showModal();
}

function toggleEventTimeFields() {
  const allDay = document.getElementById('event-all-day').checked;
  document.getElementById('event-time-fields').classList.toggle('hidden', allDay);
}

function saveEventFromForm(e) {
  e.preventDefault();
  const id = document.getElementById('event-id').value;
  const allDay = document.getElementById('event-all-day').checked;
  const event = {
    id: id || generateId(),
    title: document.getElementById('event-title').value.trim(),
    date: document.getElementById('event-date').value,
    allDay,
    startTime: allDay ? '' : document.getElementById('event-start').value,
    endTime: allDay ? '' : document.getElementById('event-end').value,
    color: document.getElementById('event-color').value,
    description: document.getElementById('event-description').value.trim(),
  };

  let events = getEvents();
  if (id) {
    events = events.map((ev) => (ev.id === id ? event : ev));
  } else {
    events.push(event);
  }
  saveEvents(events);
  document.getElementById('event-modal').close();
  renderCalendar();
  if (selectedDayISO) renderDayEventsList();
}

function deleteEvent() {
  const id = document.getElementById('event-id').value;
  if (!id) return;
  if (!confirm('Delete this event?')) return;
  saveEvents(getEvents().filter((e) => e.id !== id));
  document.getElementById('event-modal').close();
  renderCalendar();
  if (selectedDayISO) renderDayEventsList();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function initCalendar() {
  document.getElementById('cal-prev-month').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });
  document.getElementById('cal-next-month').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });
  document.getElementById('cal-today-btn').addEventListener('click', () => {
    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    renderCalendar();
  });
  document.getElementById('day-add-event-btn').addEventListener('click', () => openEventModal(null));
  document.getElementById('day-panel-close').addEventListener('click', () => {
    document.getElementById('day-panel').close();
  });
  document.getElementById('event-cancel-btn').addEventListener('click', () => {
    document.getElementById('event-modal').close();
  });
  document.getElementById('event-form').addEventListener('submit', saveEventFromForm);
  document.getElementById('event-delete-btn').addEventListener('click', deleteEvent);
  document.getElementById('event-all-day').addEventListener('change', toggleEventTimeFields);

  renderCalendar();
}
