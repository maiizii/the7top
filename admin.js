const loginPanel = document.getElementById('login-panel');
const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');
const passwordInput = document.getElementById('admin-password');
const dashboard = document.getElementById('dashboard');
const storySelect = document.getElementById('story-select');
const refreshBtn = document.getElementById('refresh-btn');
const addEntryBtn = document.getElementById('add-entry');
const saveBtn = document.getElementById('save-btn');
const tableStatus = document.getElementById('table-status');
const tbody = document.getElementById('entries-body');
const rowTemplate = document.getElementById('entry-row');

let adminKey = '';
let stories = [];
let entries = [];
let currentSlug = '';
let dirty = false;
let loading = false;

const formatNY = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const formatted = date.toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false });
  return `${formatted} (America/New_York)`;
};

const toNewYorkISOString = (value) => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'longOffset'
  });
  const parts = formatter.formatToParts(date);
  const values = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }
  const label = values.timeZoneName || 'GMT-00:00';
  const match = label.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  const sign = match ? match[1] : '+';
  const hours = match ? match[2].padStart(2, '0') : '00';
  const minutes = match ? (match[3] || '00').padStart(2, '0') : '00';
  const { year, month, day, hour, minute, second } = values;
  if (!year || !month || !day || !hour || !minute || !second) {
    return null;
  }
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${hours}:${minutes}`;
};

const setLoginStatus = (message, tone = '') => {
  if (!loginStatus) return;
  loginStatus.textContent = message || '';
  loginStatus.className = `admin-status ${tone}`.trim();
};

const setTableStatus = (message, tone = '') => {
  if (!tableStatus) return;
  tableStatus.textContent = message || '';
  tableStatus.className = `admin-status ${tone}`.trim();
};

const markDirty = (state) => {
  dirty = state;
  if (saveBtn) {
    saveBtn.disabled = !dirty || loading;
  }
};

const authenticate = async (password) => {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Login failed (${res.status})`);
  }
  const data = await res.json().catch(() => ({}));
  if (!data?.ok) {
    throw new Error('Invalid credentials');
  }
};

const loadStories = async () => {
  const res = await fetch('/stories/list.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Unable to load stories');
  const data = await res.json();
  const list = Array.isArray(data?.stories) ? data.stories : [];
  stories = list.filter(item => item && typeof item.slug === 'string');
  if (storySelect) {
    storySelect.innerHTML = stories
      .map(item => `<option value="${item.slug}">${item.title || item.slug}</option>`)
      .join('');
  }
};

const renderEntries = () => {
  if (!tbody || !rowTemplate) return;
  tbody.innerHTML = '';
  const fragment = document.createDocumentFragment();
  entries.forEach((entry, index) => {
    const { solverId, name, claimedAt } = entry;
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.index = String(index);
    const rankCell = row.querySelector('.col-rank');
    const idCell = row.querySelector('.col-id');
    const nameInput = row.querySelector('.row-name');
    const timeInput = row.querySelector('.row-time');
    if (rankCell) rankCell.textContent = `#${index + 1}`;
    if (idCell) idCell.textContent = solverId;
    if (nameInput) nameInput.value = name || '';
    if (timeInput) timeInput.value = claimedAt || '';
    const timeDisplay = row.querySelector('.row-time-display');
    if (timeDisplay) timeDisplay.textContent = formatNY(claimedAt);
    fragment.appendChild(row);
  });
  tbody.appendChild(fragment);
  setTableStatus(entries.length ? '' : 'No entries recorded.', entries.length ? '' : 'warn');
};

const fetchLeaderboard = async () => {
  if (!currentSlug) return;
  loading = true;
  markDirty(false);
  setTableStatus('Loading leaderboard…', 'pending');
  try {
    const res = await fetch(`/api/admin/leaderboard/${currentSlug}`, {
      headers: { 'x-admin-key': adminKey }
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('unauthorized');
      }
      const text = await res.text().catch(() => '');
      throw new Error(text || `Failed to load leaderboard (${res.status})`);
    }
    const data = await res.json();
    entries = Array.isArray(data?.data) ? data.data.map(item => ({
      solverId: String(item.solverId || ''),
      name: item?.name ? String(item.name) : '',
      claimedAt: item?.claimedAt ? String(item.claimedAt) : ''
    })) : [];
    renderEntries();
    markDirty(false);
  } finally {
    loading = false;
    if (!entries.length) {
      setTableStatus('No entries recorded.', 'warn');
    }
  }
};

const ensureAuthorized = () => {
  if (!adminKey) throw new Error('Not authorized');
};

const saveChanges = async () => {
  ensureAuthorized();
  if (!currentSlug) {
    setTableStatus('Select a story first.', 'warn');
    return;
  }
  loading = true;
  markDirty(false);
  setTableStatus('Saving…', 'pending');
  const payloadEntries = entries.map(item => {
    const solverId = item.solverId?.trim();
    if (!solverId) {
      throw new Error('Each entry requires a solver ID.');
    }
    const name = item.name ? item.name.trim() : '';
    const timeRaw = item.claimedAt ? item.claimedAt.trim() : '';
    let claimedAt = null;
    if (timeRaw) {
      const formatted = toNewYorkISOString(timeRaw);
      if (!formatted) {
        throw new Error(`Invalid time: ${timeRaw}`);
      }
      claimedAt = formatted;
    }
    return { solverId, name, claimedAt };
  });
  const payload = { entries: payloadEntries };
  const res = await fetch(`/api/admin/leaderboard/${currentSlug}`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      'x-admin-key': adminKey
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('unauthorized');
    }
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to save (${res.status})`);
  }
  const data = await res.json().catch(() => ({}));
  if (!data?.ok) {
    throw new Error(data?.message || 'Save rejected');
  }
  setTableStatus('Saved.', 'ok');
  loading = false;
  markDirty(false);
};

const resetAuth = (message = 'Session expired. Please login again.') => {
  adminKey = '';
  entries = [];
  renderEntries();
  if (dashboard) dashboard.hidden = true;
  if (loginPanel) loginPanel.hidden = false;
  setLoginStatus(message, 'warn');
  setTableStatus('', '');
  passwordInput?.focus();
};

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = passwordInput?.value || '';
  if (!password) {
    setLoginStatus('Password required.', 'warn');
    return;
  }
  try {
    setLoginStatus('Verifying…', 'pending');
    await authenticate(password);
    adminKey = password;
    await loadStories();
    if (!stories.length) {
      setLoginStatus('No stories available.', 'warn');
      return;
    }
    currentSlug = stories[0]?.slug || '';
    if (storySelect) storySelect.value = currentSlug;
    await fetchLeaderboard();
    setLoginStatus('Authenticated.', 'ok');
    if (loginPanel) loginPanel.hidden = true;
    if (dashboard) dashboard.hidden = false;
  } catch (err) {
    console.error(err);
    adminKey = '';
    const message = err?.message === 'unauthorized' ? 'Invalid password.' : err?.message || 'Login failed.';
    setLoginStatus(message, 'warn');
  }
});

storySelect?.addEventListener('change', async (event) => {
  const value = event.target?.value;
  if (typeof value === 'string') {
    currentSlug = value;
    try {
      await fetchLeaderboard();
    } catch (err) {
      console.error(err);
      if (err?.message === 'unauthorized') {
        resetAuth();
      } else {
        setTableStatus(err?.message || 'Failed to load leaderboard.', 'warn');
      }
    }
  }
});

refreshBtn?.addEventListener('click', async () => {
  try {
    await fetchLeaderboard();
  } catch (err) {
    console.error(err);
    if (err?.message === 'unauthorized') {
      resetAuth();
    } else {
      setTableStatus(err?.message || 'Failed to load leaderboard.', 'warn');
    }
  }
});

saveBtn?.addEventListener('click', async () => {
  try {
    await saveChanges();
  } catch (err) {
    console.error(err);
    if (err?.message === 'unauthorized') {
      resetAuth();
    } else {
      setTableStatus(err?.message || 'Save failed.', 'warn');
      markDirty(true);
      loading = false;
    }
  }
});

addEntryBtn?.addEventListener('click', () => {
  const solverId = prompt('Enter solver ID');
  if (!solverId) return;
  entries.push({ solverId: solverId.trim(), name: '', claimedAt: '' });
  renderEntries();
  markDirty(true);
});

tbody?.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const row = target.closest('tr');
  if (!row) return;
  const index = Number(row.dataset.index);
  if (!Number.isInteger(index) || index < 0 || index >= entries.length) return;
  if (target.classList.contains('row-name')) {
    entries[index].name = target.value;
  } else if (target.classList.contains('row-time')) {
    entries[index].claimedAt = target.value;
    const display = row.querySelector('.row-time-display');
    if (display) display.textContent = formatNY(target.value);
  }
  markDirty(true);
});

tbody?.addEventListener('click', (event) => {
  const button = event.target;
  if (!(button instanceof HTMLButtonElement)) return;
  const action = button.dataset.action;
  const row = button.closest('tr');
  if (!row) return;
  const index = Number(row.dataset.index);
  if (!Number.isInteger(index) || index < 0 || index >= entries.length) return;
  if (action === 'delete') {
    entries.splice(index, 1);
    renderEntries();
    markDirty(true);
    return;
  }
  if (action === 'up' && index > 0) {
    [entries[index - 1], entries[index]] = [entries[index], entries[index - 1]];
    renderEntries();
    markDirty(true);
    return;
  }
  if (action === 'down' && index < entries.length - 1) {
    [entries[index + 1], entries[index]] = [entries[index], entries[index + 1]];
    renderEntries();
    markDirty(true);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && dirty) {
    setTableStatus('Unsaved changes pending.', 'warn');
  }
});

window.addEventListener('beforeunload', (event) => {
  if (dirty) {
    event.preventDefault();
    event.returnValue = '';
  }
});

if (passwordInput) {
  passwordInput.focus();
}
