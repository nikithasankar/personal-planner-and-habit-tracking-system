let selectedNoteDate = formatDateISO(new Date());

function loadNoteForDate(dateISO) {
  const notes = getNotes();
  const note = notes[dateISO];
  const textarea = document.getElementById('notes-textarea');
  const hint = document.getElementById('notes-empty-hint');
  const status = document.getElementById('notes-status');

  textarea.value = note ? note.content : '';
  hint.classList.toggle('hidden', !!(note && note.content));
  status.textContent = note && note.updatedAt
    ? `Last saved: ${new Date(note.updatedAt).toLocaleString()}`
    : '';
}

function updateNotesDateUI() {
  document.getElementById('notes-date-picker').value = selectedNoteDate;
  document.getElementById('notes-date-label').textContent = formatDisplayDate(selectedNoteDate);
  loadNoteForDate(selectedNoteDate);
}

function saveNote() {
  const content = document.getElementById('notes-textarea').value.trim();
  const notes = getNotes();
  const status = document.getElementById('notes-status');
  const hint = document.getElementById('notes-empty-hint');

  if (!content) {
    delete notes[selectedNoteDate];
    saveNotes(notes);
    status.textContent = 'Note cleared.';
    hint.classList.remove('hidden');
    return;
  }

  notes[selectedNoteDate] = {
    id: notes[selectedNoteDate]?.id || generateId(),
    content,
    updatedAt: new Date().toISOString(),
  };
  saveNotes(notes);
  status.textContent = `Saved at ${new Date().toLocaleTimeString()}`;
  hint.classList.add('hidden');
}

function deleteNote() {
  const notes = getNotes();
  if (!notes[selectedNoteDate]) {
    document.getElementById('notes-status').textContent = 'No note to delete.';
    return;
  }
  if (!confirm('Delete note for this day?')) return;
  delete notes[selectedNoteDate];
  saveNotes(notes);
  document.getElementById('notes-textarea').value = '';
  document.getElementById('notes-empty-hint').classList.remove('hidden');
  document.getElementById('notes-status').textContent = 'Note deleted.';
}

function initNotes() {
  document.getElementById('notes-prev-day').addEventListener('click', () => {
    selectedNoteDate = formatDateISO(addDays(parseDateISO(selectedNoteDate), -1));
    updateNotesDateUI();
  });
  document.getElementById('notes-next-day').addEventListener('click', () => {
    selectedNoteDate = formatDateISO(addDays(parseDateISO(selectedNoteDate), 1));
    updateNotesDateUI();
  });
  document.getElementById('notes-date-picker').addEventListener('change', (e) => {
    selectedNoteDate = e.target.value;
    updateNotesDateUI();
  });
  document.getElementById('notes-save-btn').addEventListener('click', saveNote);
  document.getElementById('notes-delete-btn').addEventListener('click', deleteNote);
  document.getElementById('notes-textarea').addEventListener('blur', saveNote);

  updateNotesDateUI();
}
