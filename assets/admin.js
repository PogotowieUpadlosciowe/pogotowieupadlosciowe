const API_BASE = 'https://pogotowieupadlosciowe-api-v2.pogotowieupadlosciowe.workers.dev';

const STATUS_LABELS = Object.freeze({
  new: 'Nowe',
  contacted: 'Kontakt wykonany',
  analysis: 'W analizie',
  waiting_documents: 'Oczekiwanie na dokumenty',
  completed: 'Zakończone',
  rejected: 'Odrzucone'
});

const DETAIL_FIELDS = Object.freeze([
  ['full_name', 'Imię i nazwisko'],
  ['pesel', 'PESEL'],
  ['nip', 'NIP'],
  ['phone', 'Telefon'],
  ['email', 'E-mail'],
  ['address', 'Adres'],
  ['assets', 'Majątek'],
  ['cash', 'Gotówka'],
  ['bank_accounts', 'Rachunki bankowe'],
  ['debtors', 'Dłużnicy'],
  ['creditors_list', 'Wierzyciele'],
  ['disputed_debts', 'Długi sporne'],
  ['income_6m', 'Dochody za 6 miesięcy'],
  ['expenses_6m', 'Koszty za 6 miesięcy'],
  ['legal_actions_property', 'Czynności dotyczące nieruchomości'],
  ['legal_actions_assets', 'Czynności dotyczące majątku'],
  ['family_situation', 'Sytuacja rodzinna i zawodowa'],
  ['insolvency_story', 'Historia niewypłacalności'],
  ['privacy', 'Potwierdzenie polityki prywatności']
]);

let submissions = [];
let selectedId = null;
let requestInProgress = false;

const elements = {
  token: document.getElementById('token'),
  load: document.getElementById('load'),
  clear: document.getElementById('clear'),
  refresh: document.getElementById('refresh'),
  statusBox: document.getElementById('admin-status'),
  stats: document.getElementById('admin-stats'),
  filters: document.getElementById('admin-filters'),
  workspace: document.getElementById('admin-workspace'),
  statTotal: document.getElementById('stat-total'),
  statUnread: document.getElementById('stat-unread'),
  statActive: document.getElementById('stat-active'),
  statCompleted: document.getElementById('stat-completed'),
  search: document.getElementById('search'),
  statusFilter: document.getElementById('status-filter'),
  readFilter: document.getElementById('read-filter'),
  sortOrder: document.getElementById('sort-order'),
  visibleCount: document.getElementById('visible-count'),
  list: document.getElementById('submission-list'),
  listEmpty: document.getElementById('list-empty'),
  detailEmpty: document.getElementById('detail-empty'),
  detailContent: document.getElementById('detail-content'),
  caseReference: document.getElementById('case-reference'),
  caseName: document.getElementById('case-name'),
  caseDates: document.getElementById('case-dates'),
  caseStatusBadge: document.getElementById('case-status-badge'),
  emailLink: document.getElementById('case-email-link'),
  phoneLink: document.getElementById('case-phone-link'),
  copyEmail: document.getElementById('copy-email'),
  copyPhone: document.getElementById('copy-phone'),
  caseStatus: document.getElementById('case-status'),
  toggleRead: document.getElementById('toggle-read'),
  notes: document.getElementById('admin-notes'),
  notesCounter: document.getElementById('notes-counter'),
  saveCase: document.getElementById('save-case'),
  deleteCase: document.getElementById('delete-case'),
  details: document.getElementById('submission-details')
};

function setStatus(message, type = 'error') {
  elements.statusBox.textContent = message;
  elements.statusBox.className = `form-status ${type}`;
}

function clearStatus() {
  elements.statusBox.textContent = '';
  elements.statusBox.className = 'form-status';
}

function currentToken() {
  return elements.token.value.trim();
}

function text(value) {
  if (value === true) return 'Tak';
  if (value === false) return 'Nie';
  if (value === null || value === undefined || String(value).trim() === '') {
    return '—';
  }
  return String(value);
}

function formatDate(value) {
  if (!value) return '—';

  try {
    return new Intl.DateTimeFormat('pl-PL', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Warsaw'
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function normalize(value) {
  return String(value || '')
    .toLocaleLowerCase('pl-PL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function selectedSubmission() {
  return submissions.find((item) => item.id === selectedId) || null;
}

function setBusy(isBusy) {
  requestInProgress = isBusy;

  [
    elements.load,
    elements.refresh,
    elements.saveCase,
    elements.toggleRead,
    elements.deleteCase
  ].forEach((button) => {
    if (button) button.disabled = isBusy;
  });
}

async function apiRequest(path, options = {}) {
  const secret = currentToken();

  if (!secret) {
    throw new Error('Wpisz token administratora.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${secret}`);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    mode: 'cors',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    cache: 'no-store',
    headers
  });

  let payload = {};

  try {
    payload = await response.json();
  } catch {
    // Komunikat ogólny zostanie użyty poniżej.
  }

  if (!response.ok) {
    throw new Error(payload.error || `Błąd serwera (HTTP ${response.status}).`);
  }

  return payload;
}

function calculateStats() {
  return {
    total: submissions.length,
    unread: submissions.filter((item) => !item.is_read).length,
    active: submissions.filter(
      (item) => !['completed', 'rejected'].includes(item.status)
    ).length,
    completed: submissions.filter((item) => item.status === 'completed').length
  };
}

function renderStats() {
  const stats = calculateStats();
  elements.statTotal.textContent = String(stats.total);
  elements.statUnread.textContent = String(stats.unread);
  elements.statActive.textContent = String(stats.active);
  elements.statCompleted.textContent = String(stats.completed);
}

function filteredSubmissions() {
  const query = normalize(elements.search.value);
  const status = elements.statusFilter.value;
  const read = elements.readFilter.value;
  const sort = elements.sortOrder.value;

  const result = submissions.filter((item) => {
    const haystack = normalize([
      item.full_name,
      item.reference,
      item.phone,
      item.email
    ].join(' '));

    const matchesQuery = !query || haystack.includes(query);
    const matchesStatus = status === 'all' || item.status === status;
    const matchesRead =
      read === 'all' ||
      (read === 'read' && item.is_read) ||
      (read === 'unread' && !item.is_read);

    return matchesQuery && matchesStatus && matchesRead;
  });

  result.sort((a, b) => {
    if (sort === 'oldest') {
      return new Date(a.created_at) - new Date(b.created_at);
    }

    if (sort === 'name') {
      return String(a.full_name || '').localeCompare(
        String(b.full_name || ''),
        'pl'
      );
    }

    return new Date(b.created_at) - new Date(a.created_at);
  });

  return result;
}

function makeStatusBadge(status, compact = false) {
  const badge = document.createElement('span');
  badge.className = `status-badge status-${status}${compact ? ' status-badge-compact' : ''}`;
  badge.textContent = STATUS_LABELS[status] || 'Nowe';
  return badge;
}

function renderList() {
  const items = filteredSubmissions();
  elements.list.replaceChildren();
  elements.visibleCount.textContent = `${items.length}/${submissions.length}`;
  elements.listEmpty.hidden = items.length !== 0;

  items.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'submission-button submission-card';
    button.classList.toggle('active', item.id === selectedId);
    button.classList.toggle('unread', !item.is_read);
    button.dataset.id = item.id;

    const top = document.createElement('div');
    top.className = 'submission-card-top';

    const identity = document.createElement('div');
    identity.className = 'submission-card-identity';

    if (!item.is_read) {
      const dot = document.createElement('span');
      dot.className = 'unread-dot';
      dot.title = 'Nieprzeczytane';
      identity.append(dot);
    }

    const strong = document.createElement('strong');
    strong.textContent = text(item.full_name);
    identity.append(strong);
    top.append(identity, makeStatusBadge(item.status, true));

    const reference = document.createElement('span');
    reference.className = 'submission-reference';
    reference.textContent = text(item.reference);

    const meta = document.createElement('span');
    meta.className = 'submission-meta';
    meta.textContent = `${formatDate(item.created_at)} · ${text(item.phone)}`;

    button.append(top, reference, meta);
    button.addEventListener('click', () => selectSubmission(item.id));
    elements.list.append(button);
  });
}

function appendDetailRow(label, value) {
  const row = document.createElement('div');
  row.className = 'detail-row';

  const dt = document.createElement('dt');
  dt.textContent = label;

  const dd = document.createElement('dd');
  dd.textContent = text(value);

  row.append(dt, dd);
  elements.details.append(row);
}

function setContactLink(anchor, scheme, value) {
  const clean = String(value || '').trim();

  if (!clean) {
    anchor.href = '#';
    anchor.setAttribute('aria-disabled', 'true');
    anchor.classList.add('disabled-link');
    return;
  }

  anchor.removeAttribute('aria-disabled');
  anchor.classList.remove('disabled-link');

  if (scheme === 'tel') {
    anchor.href = `tel:${clean.replace(/[^+\d]/g, '')}`;
  } else {
    anchor.href = `mailto:${clean}`;
  }
}

function renderDetails() {
  const item = selectedSubmission();

  if (!item) {
    elements.detailEmpty.hidden = false;
    elements.detailContent.hidden = true;
    return;
  }

  elements.detailEmpty.hidden = true;
  elements.detailContent.hidden = false;
  elements.caseReference.textContent = text(item.reference);
  elements.caseName.textContent = text(item.full_name);
  elements.caseDates.textContent =
    `Utworzono: ${formatDate(item.created_at)} · ` +
    `Ostatnia zmiana: ${formatDate(item.updated_at || item.created_at)}`;

  elements.caseStatusBadge.className =
    `status-badge status-${item.status}`;
  elements.caseStatusBadge.textContent = STATUS_LABELS[item.status] || 'Nowe';

  elements.caseStatus.value = item.status || 'new';
  elements.toggleRead.textContent = item.is_read
    ? 'Oznacz jako nieprzeczytane'
    : 'Oznacz jako przeczytane';

  elements.notes.value = String(item.admin_notes || '');
  elements.notesCounter.textContent = String(elements.notes.value.length);

  setContactLink(elements.emailLink, 'mailto', item.email);
  setContactLink(elements.phoneLink, 'tel', item.phone);
  elements.copyEmail.disabled = !item.email;
  elements.copyPhone.disabled = !item.phone;

  elements.details.replaceChildren();
  DETAIL_FIELDS.forEach(([key, label]) => appendDetailRow(label, item[key]));
}

function renderAll() {
  renderStats();
  renderList();
  renderDetails();
}

async function loadSubmissions({ preserveSelection = true } = {}) {
  if (requestInProgress) return;

  if (!currentToken()) {
    setStatus('Wpisz token administratora.');
    return;
  }

  const previousId = preserveSelection ? selectedId : null;
  setBusy(true);
  setStatus('Pobieranie zgłoszeń…', 'success');

  try {
    const payload = await apiRequest('/submissions');
    submissions = Array.isArray(payload.items) ? payload.items : [];
    selectedId = previousId && submissions.some((item) => item.id === previousId)
      ? previousId
      : null;

    elements.stats.hidden = false;
    elements.filters.hidden = false;
    elements.workspace.hidden = false;
    renderAll();
    setStatus(`Pobrano zgłoszenia: ${submissions.length}.`, 'success');
  } catch (error) {
    submissions = [];
    selectedId = null;
    renderAll();
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function selectSubmission(id) {
  selectedId = id;
  renderAll();

  const item = selectedSubmission();
  if (!item || item.is_read || requestInProgress) return;

  try {
    const payload = await apiRequest(`/submissions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_read: true })
    });

    replaceSubmission(payload.item);
    renderAll();
  } catch (error) {
    setStatus(`Nie udało się oznaczyć jako przeczytane: ${error.message}`);
  }
}

function replaceSubmission(updatedItem) {
  const index = submissions.findIndex((item) => item.id === updatedItem.id);
  if (index !== -1) submissions[index] = updatedItem;
}

async function saveCase() {
  const item = selectedSubmission();
  if (!item || requestInProgress) return;

  setBusy(true);
  setStatus('Zapisywanie zmian…', 'success');

  try {
    const payload = await apiRequest(
      `/submissions/${encodeURIComponent(item.id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: elements.caseStatus.value,
          is_read: item.is_read,
          admin_notes: elements.notes.value
        })
      }
    );

    replaceSubmission(payload.item);
    renderAll();
    setStatus('Zmiany zostały zapisane.', 'success');
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function toggleRead() {
  const item = selectedSubmission();
  if (!item || requestInProgress) return;

  setBusy(true);

  try {
    const payload = await apiRequest(
      `/submissions/${encodeURIComponent(item.id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ is_read: !item.is_read })
      }
    );

    replaceSubmission(payload.item);
    renderAll();
    setStatus(
      payload.item.is_read
        ? 'Zgłoszenie oznaczono jako przeczytane.'
        : 'Zgłoszenie oznaczono jako nieprzeczytane.',
      'success'
    );
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function deleteCase() {
  const item = selectedSubmission();
  if (!item || requestInProgress) return;

  const expected = text(item.reference);
  const answer = window.prompt(
    `Aby trwale usunąć zgłoszenie, wpisz jego numer:\n${expected}`
  );

  if (answer !== expected) {
    if (answer !== null) setStatus('Numer potwierdzenia nie jest zgodny.');
    return;
  }

  setBusy(true);
  setStatus('Usuwanie zgłoszenia…', 'success');

  try {
    await apiRequest(`/submissions/${encodeURIComponent(item.id)}`, {
      method: 'DELETE',
      headers: { 'X-Delete-Confirmation': item.id }
    });

    submissions = submissions.filter((submission) => submission.id !== item.id);
    selectedId = null;
    renderAll();
    setStatus('Zgłoszenie zostało trwale usunięte.', 'success');
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function copyValue(value, label) {
  const clean = String(value || '').trim();
  if (!clean) return;

  try {
    await navigator.clipboard.writeText(clean);
    setStatus(`${label} skopiowano do schowka.`, 'success');
  } catch {
    setStatus(`Nie udało się skopiować: ${label.toLocaleLowerCase('pl-PL')}.`);
  }
}

function clearSession() {
  elements.token.value = '';
  submissions = [];
  selectedId = null;
  elements.search.value = '';
  elements.statusFilter.value = 'all';
  elements.readFilter.value = 'all';
  elements.sortOrder.value = 'newest';
  elements.stats.hidden = true;
  elements.filters.hidden = true;
  elements.workspace.hidden = true;
  renderAll();
  clearStatus();
}

elements.load.addEventListener('click', () => loadSubmissions({ preserveSelection: false }));
elements.refresh.addEventListener('click', () => loadSubmissions({ preserveSelection: true }));
elements.clear.addEventListener('click', clearSession);
elements.saveCase.addEventListener('click', saveCase);
elements.toggleRead.addEventListener('click', toggleRead);
elements.deleteCase.addEventListener('click', deleteCase);
elements.copyEmail.addEventListener('click', () => {
  const item = selectedSubmission();
  if (item) copyValue(item.email, 'E-mail');
});
elements.copyPhone.addEventListener('click', () => {
  const item = selectedSubmission();
  if (item) copyValue(item.phone, 'Telefon');
});
elements.notes.addEventListener('input', () => {
  elements.notesCounter.textContent = String(elements.notes.value.length);
});
elements.token.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') loadSubmissions({ preserveSelection: false });
});
[
  elements.search,
  elements.statusFilter,
  elements.readFilter,
  elements.sortOrder
].forEach((control) => control.addEventListener('input', renderList));
