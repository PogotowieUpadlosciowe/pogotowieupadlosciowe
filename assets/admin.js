const API_BASE = 'https://pogotowieupadlosciowe-api-v2.pogotowieupadlosciowe.workers.dev';

const STATUS_LABELS = Object.freeze({
  new: 'Nowe',
  contacted: 'Kontakt wykonany',
  analysis: 'W analizie',
  waiting_documents: 'Oczekiwanie na dokumenty',
  completed: 'Zakończone',
  rejected: 'Odrzucone'
});

const PAYMENT_LABELS = Object.freeze({
  not_set: 'Nie ustawiono',
  awaiting: 'Oczekuje na płatność',
  paid: 'Opłacona',
  refunded: 'Zwrócona'
});

const CLOSURE_LABELS = Object.freeze({
  none: 'Nie dotyczy',
  service_completed: 'Usługa wykonana',
  no_purchase: 'Nie rozpoczęto płatnej współpracy',
  cancelled: 'Rezygnacja / anulowanie',
  refunded: 'Zwrot płatności',
  dispute: 'Spór / reklamacja'
});

const ARCHIVE_STATUS_LABELS = Object.freeze({
  not_scheduled: 'Archiwizacja nie jest zaplanowana',
  scheduled: 'Archiwizacja zaplanowana',
  archiving: 'Trwa archiwizacja',
  archived: 'Sprawa zarchiwizowana',
  error: 'Błąd archiwizacji'
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
let currentAttachments = [];
let archiveItems = [];
let archiveSelectedId = null;
let archiveSelectedItem = null;

const elements = {
  token: document.getElementById('token'),
  load: document.getElementById('load'),
  clear: document.getElementById('clear'),
  refresh: document.getElementById('refresh'),
  downloadBackup: document.getElementById('download-backup'),
  loadRetentionReport: document.getElementById('load-retention-report'),
  processArchive: document.getElementById('process-archive'),
  openArchive: document.getElementById('open-archive'),
  dataTools: document.getElementById('admin-data-tools'),
  retentionReport: document.getElementById('retention-report'),
  retentionGeneratedAt: document.getElementById('retention-generated-at'),
  retentionHolds: document.getElementById('retention-holds'),
  retention30: document.getElementById('retention-30'),
  retention90: document.getElementById('retention-90'),
  retention180: document.getElementById('retention-180'),
  retention365: document.getElementById('retention-365'),
  retentionNote: document.getElementById('retention-note'),
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
  paymentStatus: document.getElementById('payment-status'),
  closureReason: document.getElementById('closure-reason'),
  caseArchiveStatus: document.getElementById('case-archive-status'),
  caseArchiveStatusTitle: document.getElementById('case-archive-status-title'),
  caseArchiveStatusDetails: document.getElementById('case-archive-status-details'),
  toggleRead: document.getElementById('toggle-read'),
  retentionHold: document.getElementById('retention-hold'),
  notes: document.getElementById('admin-notes'),
  notesCounter: document.getElementById('notes-counter'),
  saveCase: document.getElementById('save-case'),
  saveFeedback: document.getElementById('case-save-feedback'),
  deleteCase: document.getElementById('delete-case'),
  details: document.getElementById('submission-details'),
  attachmentFile: document.getElementById('attachment-file'),
  uploadAttachment: document.getElementById('upload-attachment'),
  attachmentStatus: document.getElementById('attachment-status'),
  attachmentList: document.getElementById('attachment-list'),
  attachmentEmpty: document.getElementById('attachment-empty'),
  archiveSection: document.getElementById('archive-section'),
  closeArchive: document.getElementById('close-archive'),
  archiveSearch: document.getElementById('archive-search'),
  searchArchive: document.getElementById('search-archive'),
  archiveCount: document.getElementById('archive-count'),
  archiveList: document.getElementById('archive-list'),
  archiveEmpty: document.getElementById('archive-empty'),
  archiveDetailEmpty: document.getElementById('archive-detail-empty'),
  archiveDetail: document.getElementById('archive-detail'),
  archiveReference: document.getElementById('archive-reference'),
  archiveName: document.getElementById('archive-name'),
  archiveDates: document.getElementById('archive-dates'),
  archiveSummary: document.getElementById('archive-summary'),
  archiveAttachments: document.getElementById('archive-attachments'),
  archiveAttachmentsEmpty: document.getElementById('archive-attachments-empty'),
  archiveDetails: document.getElementById('archive-details')
};

function setStatus(message, type = 'error') {
  elements.statusBox.textContent = message;
  elements.statusBox.className = `form-status ${type}`;
}

function clearStatus() {
  elements.statusBox.textContent = '';
  elements.statusBox.className = 'form-status';
}

function setSaveFeedback(message = '', type = '') {
  if (!elements.saveFeedback || !elements.saveCase) return;

  elements.saveFeedback.textContent = message;
  elements.saveFeedback.className = type
    ? `case-save-feedback ${type}`
    : 'case-save-feedback';
  elements.saveFeedback.hidden = !message;

  elements.saveCase.classList.remove(
    'save-pending',
    'save-success',
    'save-error',
    'has-unsaved-changes'
  );

  if (type === 'pending') {
    elements.saveCase.textContent = 'Zapisywanie…';
    elements.saveCase.classList.add('save-pending');
  } else if (type === 'success') {
    elements.saveCase.textContent = '✓ Zapisano';
    elements.saveCase.classList.add('save-success');
  } else if (type === 'error') {
    elements.saveCase.textContent = 'Spróbuj ponownie';
    elements.saveCase.classList.add('save-error');
  } else if (type === 'dirty') {
    elements.saveCase.textContent = 'Zapisz zmiany';
    elements.saveCase.classList.add('has-unsaved-changes');
  } else {
    elements.saveCase.textContent = 'Zapisz zmiany';
  }
}

function markCaseDirty() {
  if (!selectedSubmission() || requestInProgress) return;
  setSaveFeedback('Masz niezapisane zmiany.', 'dirty');
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

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    elements.deleteCase,
    elements.downloadBackup,
    elements.loadRetentionReport,
    elements.processArchive,
    elements.openArchive,
    elements.uploadAttachment,
    elements.searchArchive,
    elements.closeArchive
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
    currentAttachments = [];
    renderAttachmentList();
    setSaveFeedback();
    return;
  }

  elements.detailEmpty.hidden = true;
  elements.detailContent.hidden = false;
  elements.caseReference.textContent = text(item.reference);
  elements.caseName.textContent = text(item.full_name);
  const closedInfo = item.closed_at
    ? ` · Zamknięto: ${formatDate(item.closed_at)}`
    : '';

  elements.caseDates.textContent =
    `Utworzono: ${formatDate(item.created_at)} · ` +
    `Ostatnia zmiana: ${formatDate(item.updated_at || item.created_at)}` +
    closedInfo;

  elements.caseStatusBadge.className =
    `status-badge status-${item.status}`;
  elements.caseStatusBadge.textContent = STATUS_LABELS[item.status] || 'Nowe';

  elements.caseStatus.value = item.status || 'new';
  elements.paymentStatus.value = item.payment_status || 'not_set';
  elements.closureReason.value = item.closure_reason || 'none';

  const archiveStatus = item.archive_status || 'not_scheduled';
  elements.caseArchiveStatus.hidden = false;
  elements.caseArchiveStatusTitle.textContent = ARCHIVE_STATUS_LABELS[archiveStatus] || archiveStatus;
  const archiveParts = [];
  if (item.archive_at) archiveParts.push(`Plan archiwizacji: ${formatDate(item.archive_at)}`);
  if (item.delete_after) archiveParts.push(`Planowane usunięcie: ${formatDate(item.delete_after)}`);
  archiveParts.push(`Załączniki: ${Number(item.attachment_count || 0)}`);
  elements.caseArchiveStatusDetails.textContent = archiveParts.join(' · ');
  elements.caseArchiveStatus.className = `case-archive-status archive-${archiveStatus}`;

  elements.toggleRead.textContent = item.is_read
    ? 'Oznacz jako nieprzeczytane'
    : 'Oznacz jako przeczytane';

  elements.retentionHold.checked = Boolean(item.retention_hold);

  elements.notes.value = String(item.admin_notes || '');
  elements.notesCounter.textContent = String(elements.notes.value.length);

  setContactLink(elements.emailLink, 'mailto', item.email);
  setContactLink(elements.phoneLink, 'tel', item.phone);
  elements.copyEmail.disabled = !item.email;
  elements.copyPhone.disabled = !item.phone;

  elements.details.replaceChildren();
  DETAIL_FIELDS.forEach(([key, label]) => appendDetailRow(label, item[key]));
  renderAttachmentList();
}

function renderAll() {
  renderStats();
  renderList();
  renderDetails();
}

async function loadSubmissions({ preserveSelection = true, force = false } = {}) {
  if (requestInProgress && !force) return;

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

    elements.dataTools.hidden = false;
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
  if (selectedId !== id) setSaveFeedback();
  selectedId = id;
  currentAttachments = [];
  renderAll();

  const item = selectedSubmission();
  if (!item) return;

  try {
    if (!item.is_read && !requestInProgress) {
      const payload = await apiRequest(`/submissions/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true })
      });
      replaceSubmission(payload.item);
      renderAll();
    }

    await loadAttachments(id);
  } catch (error) {
    setStatus(`Nie udało się otworzyć pełnych danych sprawy: ${error.message}`);
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
  setSaveFeedback('Trwa zapisywanie zmian…', 'pending');
  setStatus('Zapisywanie zmian…', 'success');

  try {
    const payload = await apiRequest(
      `/submissions/${encodeURIComponent(item.id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: elements.caseStatus.value,
          payment_status: elements.paymentStatus.value,
          closure_reason: elements.closureReason.value,
          is_read: item.is_read,
          retention_hold: elements.retentionHold.checked,
          admin_notes: elements.notes.value
        })
      }
    );

    replaceSubmission(payload.item);
    renderAll();

    const savedAt = new Intl.DateTimeFormat('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Warsaw'
    }).format(new Date());

    setSaveFeedback(`Zmiany zostały zapisane o ${savedAt}.`, 'success');
    setStatus('Zmiany zostały zapisane.', 'success');
  } catch (error) {
    setSaveFeedback(`Nie udało się zapisać zmian: ${error.message}`, 'error');
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

function filenameFromDisposition(value) {
  const match = String(value || '').match(/filename="?([^";]+)"?/i);
  return match ? match[1] : `pogotowie-upadlosciowe-kopia-${Date.now()}.json`;
}

async function downloadEncryptedBackup() {
  if (requestInProgress) return;

  const secret = currentToken();
  if (!secret) {
    setStatus('Wpisz token administratora.');
    return;
  }

  setBusy(true);
  setStatus('Przygotowywanie zaszyfrowanej kopii…', 'success');

  try {
    const response = await fetch(`${API_BASE}/admin/backup`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${secret}`
      }
    });

    if (!response.ok) {
      let payload = {};
      try {
        payload = await response.json();
      } catch {
        // Użyj komunikatu ogólnego.
      }
      throw new Error(payload.error || `Błąd serwera (HTTP ${response.status}).`);
    }

    const blob = await response.blob();
    const filename = filenameFromDisposition(
      response.headers.get('Content-Disposition')
    );
    const checksum = response.headers.get('X-Backup-Checksum') || '';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setStatus(
      checksum
        ? `Kopia została pobrana. Suma kontrolna: ${checksum}`
        : 'Kopia została pobrana.',
      'success'
    );
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

function renderRetentionReport(payload) {
  const summary = payload.summary || {};
  const ages = payload.closed_without_hold_older_than_days || {};

  elements.retentionGeneratedAt.textContent = formatDate(payload.generated_at);
  elements.retentionHolds.textContent = String(summary.holds || 0);
  elements.retention30.textContent = String(ages[30] || 0);
  elements.retention90.textContent = String(ages[90] || 0);
  elements.retention180.textContent = String(ages[180] || 0);
  elements.retention365.textContent = String(ages[365] || 0);
  elements.retentionNote.textContent = payload.note || '';
  elements.retentionReport.hidden = false;
}

async function loadRetentionReport() {
  if (requestInProgress) return;

  setBusy(true);
  setStatus('Przygotowywanie raportu retencji…', 'success');

  try {
    const payload = await apiRequest('/admin/retention-report');
    renderRetentionReport(payload);
    setStatus('Raport retencji został zaktualizowany.', 'success');
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}


function setAttachmentStatus(message = '', type = '') {
  elements.attachmentStatus.textContent = message;
  elements.attachmentStatus.className = type
    ? `attachment-status ${type}`
    : 'attachment-status';
}

function renderAttachmentList() {
  elements.attachmentList.replaceChildren();
  elements.attachmentEmpty.hidden = currentAttachments.length !== 0;

  currentAttachments.forEach((attachment) => {
    const row = document.createElement('div');
    row.className = 'attachment-row';

    const info = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = attachment.name || 'Załącznik';
    const meta = document.createElement('span');
    meta.textContent = `${formatBytes(attachment.size_bytes)} · ${formatDate(attachment.created_at)}`;
    info.append(name, meta);

    const actions = document.createElement('div');
    actions.className = 'attachment-actions';
    const download = document.createElement('button');
    download.type = 'button';
    download.className = 'button button-secondary';
    download.textContent = 'Pobierz';
    download.addEventListener('click', () => downloadAuthorizedFile(
      `/submissions/${encodeURIComponent(attachment.submission_id)}/attachments/${encodeURIComponent(attachment.id)}`
    ));

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'button admin-danger-button';
    remove.textContent = 'Usuń';
    remove.addEventListener('click', () => deleteAttachment(attachment));
    actions.append(download, remove);
    row.append(info, actions);
    elements.attachmentList.append(row);
  });
}

async function loadAttachments(submissionId) {
  const payload = await apiRequest(`/submissions/${encodeURIComponent(submissionId)}/attachments`);
  if (selectedId !== submissionId) return;
  currentAttachments = Array.isArray(payload.items) ? payload.items : [];
  renderAttachmentList();
}

function attachmentContentType(file) {
  if (file.type) return file.type;
  const extension = String(file.name || '').toLowerCase().split('.').pop();
  const types = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return types[extension] || 'application/octet-stream';
}

async function uploadAttachment() {
  const item = selectedSubmission();
  const file = elements.attachmentFile.files?.[0];

  if (!item) {
    setAttachmentStatus('Najpierw wybierz sprawę.', 'error');
    return;
  }
  if (!file) {
    setAttachmentStatus('Wybierz plik do dodania.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    setAttachmentStatus('Plik przekracza limit 10 MB.', 'error');
    return;
  }

  const secret = currentToken();
  if (!secret || requestInProgress) return;

  setBusy(true);
  setAttachmentStatus('Szyfrowanie i wysyłanie załącznika…', 'pending');

  try {
    const response = await fetch(
      `${API_BASE}/submissions/${encodeURIComponent(item.id)}/attachments`,
      {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': attachmentContentType(file),
          'X-File-Name': encodeURIComponent(file.name)
        },
        body: file
      }
    );

    let payload = {};
    try { payload = await response.json(); } catch { /* komunikat ogólny */ }
    if (!response.ok) throw new Error(payload.error || `Błąd serwera (HTTP ${response.status}).`);

    elements.attachmentFile.value = '';
    await loadSubmissions({ preserveSelection: true, force: true });
    await loadAttachments(item.id);
    setAttachmentStatus('Załącznik został bezpiecznie zapisany.', 'success');
  } catch (error) {
    setAttachmentStatus(error.message, 'error');
  } finally {
    setBusy(false);
  }
}

async function deleteAttachment(attachment) {
  const confirmation = window.confirm(`Trwale usunąć załącznik „${attachment.name}”?`);
  if (!confirmation || requestInProgress) return;

  setBusy(true);
  setAttachmentStatus('Usuwanie załącznika…', 'pending');

  try {
    await apiRequest(
      `/submissions/${encodeURIComponent(attachment.submission_id)}/attachments/${encodeURIComponent(attachment.id)}`,
      {
        method: 'DELETE',
        headers: { 'X-Delete-Confirmation': attachment.id }
      }
    );
    await loadSubmissions({ preserveSelection: true, force: true });
    await loadAttachments(attachment.submission_id);
    setAttachmentStatus('Załącznik został usunięty.', 'success');
  } catch (error) {
    setAttachmentStatus(error.message, 'error');
  } finally {
    setBusy(false);
  }
}

async function downloadAuthorizedFile(path) {
  const secret = currentToken();
  if (!secret) {
    setStatus('Wpisz token administratora.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${secret}` }
    });

    if (!response.ok) {
      let payload = {};
      try { payload = await response.json(); } catch { /* komunikat ogólny */ }
      throw new Error(payload.error || `Błąd serwera (HTTP ${response.status}).`);
    }

    const blob = await response.blob();
    const filename = filenameFromDisposition(response.headers.get('Content-Disposition'));
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    setStatus(error.message);
  }
}

async function processArchiveNow() {
  if (requestInProgress) return;
  setBusy(true);
  setStatus('Sprawdzanie spraw oczekujących na archiwizację…', 'success');

  try {
    const payload = await apiRequest('/admin/archive/process', { method: 'POST' });
    await loadSubmissions({ preserveSelection: false, force: true });
    setStatus(
      `Archiwizacja zakończona. Sprawdzono: ${payload.attempted || 0}, ` +
      `zarchiwizowano: ${(payload.archived || []).length}, błędy: ${(payload.failed || []).length}.`,
      (payload.failed || []).length ? 'error' : 'success'
    );
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

function showArchiveView() {
  elements.archiveSection.hidden = false;
  elements.stats.hidden = true;
  elements.filters.hidden = true;
  elements.workspace.hidden = true;
  elements.archiveSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  searchArchiveCases();
}

function closeArchiveView() {
  elements.archiveSection.hidden = true;
  if (submissions.length || currentToken()) {
    elements.stats.hidden = false;
    elements.filters.hidden = false;
    elements.workspace.hidden = false;
  }
}

function renderArchiveList() {
  elements.archiveList.replaceChildren();
  elements.archiveCount.textContent = String(archiveItems.length);
  elements.archiveEmpty.hidden = archiveItems.length !== 0;

  archiveItems.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'submission-button submission-card';
    button.classList.toggle('active', item.id === archiveSelectedId);

    const name = document.createElement('strong');
    name.textContent = text(item.full_name);
    const reference = document.createElement('span');
    reference.className = 'submission-reference';
    reference.textContent = text(item.reference);
    const meta = document.createElement('span');
    meta.className = 'submission-meta';
    meta.textContent = `Zarchiwizowano: ${formatDate(item.archived_at)} · ${item.attachment_count || 0} zał.`;
    button.append(name, reference, meta);
    button.addEventListener('click', () => loadArchiveDetail(item.id));
    elements.archiveList.append(button);
  });
}

function appendArchiveRow(container, label, value) {
  const row = document.createElement('div');
  row.className = 'detail-row';
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = text(value);
  row.append(dt, dd);
  container.append(row);
}

function renderArchiveDetail(item) {
  archiveSelectedItem = item;
  elements.archiveDetailEmpty.hidden = Boolean(item);
  elements.archiveDetail.hidden = !item;
  if (!item) return;

  elements.archiveReference.textContent = text(item.reference);
  elements.archiveName.textContent = text(item.full_name);
  elements.archiveDates.textContent =
    `Zamknięto: ${formatDate(item.closed_at)} · Zarchiwizowano: ${formatDate(item.archived_at)} · ` +
    `Planowane usunięcie: ${formatDate(item.delete_after)}`;

  elements.archiveSummary.replaceChildren();
  appendArchiveRow(elements.archiveSummary, 'E-mail', item.email);
  appendArchiveRow(elements.archiveSummary, 'Telefon', item.phone);
  appendArchiveRow(elements.archiveSummary, 'Numer sprawy', item.reference);
  appendArchiveRow(elements.archiveSummary, 'Planowane usunięcie', formatDate(item.delete_after));

  elements.archiveDetails.replaceChildren();
  DETAIL_FIELDS.forEach(([key, label]) => appendArchiveRow(elements.archiveDetails, label, item[key]));

  const attachments = Array.isArray(item.attachments) ? item.attachments : [];
  elements.archiveAttachments.replaceChildren();
  elements.archiveAttachmentsEmpty.hidden = attachments.length !== 0;
  attachments.forEach((attachment) => {
    const row = document.createElement('div');
    row.className = 'attachment-row';
    const info = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = attachment.name || 'Załącznik';
    const meta = document.createElement('span');
    meta.textContent = formatBytes(attachment.size_bytes);
    info.append(strong, meta);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button button-secondary';
    button.textContent = 'Pobierz';
    button.addEventListener('click', () => downloadAuthorizedFile(
      `/admin/archive/${encodeURIComponent(item.id)}/attachments/${encodeURIComponent(attachment.id)}`
    ));
    row.append(info, button);
    elements.archiveAttachments.append(row);
  });
}

async function searchArchiveCases() {
  if (requestInProgress) return;
  setBusy(true);
  setStatus('Przeszukiwanie archiwum…', 'success');

  try {
    const query = elements.archiveSearch.value.trim();
    const payload = await apiRequest(`/admin/archive?query=${encodeURIComponent(query)}`);
    archiveItems = Array.isArray(payload.items) ? payload.items : [];
    archiveSelectedId = null;
    renderArchiveList();
    renderArchiveDetail(null);
    setStatus(`Znaleziono sprawy w archiwum: ${archiveItems.length}.`, 'success');
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function loadArchiveDetail(id) {
  if (requestInProgress) return;
  archiveSelectedId = id;
  renderArchiveList();
  setBusy(true);

  try {
    const payload = await apiRequest(`/admin/archive/${encodeURIComponent(id)}`);
    renderArchiveDetail(payload.item || null);
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

function clearSession() {
  elements.token.value = '';
  submissions = [];
  selectedId = null;
  currentAttachments = [];
  archiveItems = [];
  archiveSelectedId = null;
  archiveSelectedItem = null;
  elements.search.value = '';
  elements.statusFilter.value = 'all';
  elements.readFilter.value = 'all';
  elements.sortOrder.value = 'newest';
  elements.dataTools.hidden = true;
  elements.retentionReport.hidden = true;
  elements.stats.hidden = true;
  elements.filters.hidden = true;
  elements.workspace.hidden = true;
  elements.archiveSection.hidden = true;
  renderArchiveList();
  renderArchiveDetail(null);
  renderAll();
  clearStatus();
}

elements.load.addEventListener('click', () => loadSubmissions({ preserveSelection: false }));
elements.refresh.addEventListener('click', () => loadSubmissions({ preserveSelection: true }));
elements.clear.addEventListener('click', clearSession);
elements.downloadBackup.addEventListener('click', downloadEncryptedBackup);
elements.loadRetentionReport.addEventListener('click', loadRetentionReport);
elements.processArchive.addEventListener('click', processArchiveNow);
elements.openArchive.addEventListener('click', showArchiveView);
elements.closeArchive.addEventListener('click', closeArchiveView);
elements.searchArchive.addEventListener('click', searchArchiveCases);
elements.archiveSearch.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') searchArchiveCases();
});
elements.uploadAttachment.addEventListener('click', uploadAttachment);
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
  markCaseDirty();
});
elements.caseStatus.addEventListener('change', markCaseDirty);
elements.paymentStatus.addEventListener('change', markCaseDirty);
elements.closureReason.addEventListener('change', markCaseDirty);
elements.retentionHold.addEventListener('change', markCaseDirty);
elements.token.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') loadSubmissions({ preserveSelection: false });
});
[
  elements.search,
  elements.statusFilter,
  elements.readFilter,
  elements.sortOrder
].forEach((control) => control.addEventListener('input', renderList));
