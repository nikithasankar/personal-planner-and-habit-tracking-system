function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    const active = btn.dataset.tab === tabName;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  document.querySelectorAll('.tab-section').forEach((section) => {
    const id = section.id.replace('section-', '');
    const active = id === tabName;
    section.classList.toggle('active', active);
    section.hidden = !active;
  });
}

function initApp() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  initHabits();
  initCalendar();
  initNotes();

  setInterval(() => {
    if (document.getElementById('section-habits').classList.contains('active')) {
      checkReminders();
    }
  }, 60000);
}

document.addEventListener('DOMContentLoaded', initApp);
