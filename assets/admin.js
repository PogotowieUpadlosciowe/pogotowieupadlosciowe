const API_BASE = 'https://pogotowieupadlosciowe-api-v2.pogotowieupadlosciowe.workers.dev';

const STATUS_LABELS = Object.freeze({
  new: 'Nowe',
  contacted: 'Kontakt wykonany',
  analysis: 'W analizie',
  waiting_documents: 'Oczekiwanie na dokumenty',
  in_progress: 'W realizacji',
  completed: 'Zakończone',
  rejected: 'Odrzucone'
});

const PAYMENT_LABELS = Object.freeze({
  not_set: 'Nie ustawiono',
  awaiting: 'Oczekuje na płatność',
  paid: 'Opłacona',
  refunded: 'Zwrócona'
});


const MATERIAL_LABELS = Object.freeze({
  not_verified: 'Do weryfikacji',
  incomplete: 'Niekompletne',
  complete: 'Kompletne'
});

const PAYMENT_INSTRUCTION_LABELS = Object.freeze({
  not_configured: 'Dane do przelewu nieskonfigurowane',
  pending: 'Wysyłka w toku',
  sent: 'Dane do przelewu wysłane',
  failed: 'Błąd wysyłki danych do przelewu'
});

const EVENT_LABELS = Object.freeze({
  order_received: 'Otrzymano zamówienie',
  payment_instructions_sent: 'Wysłano dane do przelewu',
  payment_instructions_resent: 'Ponownie wysłano dane do przelewu',
  payment_instructions_failed: 'Nie udało się wysłać danych do przelewu',
  payment_marked_paid: 'Zaksięgowano płatność',
  payment_marked_refunded: 'Oznaczono zwrot płatności',
  materials_marked_incomplete: 'Oznaczono braki w materiałach',
  materials_marked_complete: 'Potwierdzono komplet materiałów',
  fulfillment_started: 'Rozpoczęto realizację',
  service_completed: 'Zakończono usługę',
  conditions_deadline_extended: 'Przedłużono termin warunków',
  case_closed_no_purchase: 'Zamknięto sprawę — warunki niespełnione',
  case_settings_updated: 'Zmieniono ustawienia sprawy'
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

const EMAIL_STATUS_LABELS = Object.freeze({
  pending: 'Oczekuje na wysyłkę',
  sent: 'Wysłano',
  failed: 'Błąd wysyłki',
  not_configured: 'Poczta nieskonfigurowana',
  unknown: 'Brak danych (starszy rekord)'
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
let invitations = [];
let activeAdminView = 'active';
let activeCaseView = 'workflow';
let caseEvents = [];
let attachmentsLoadedForId = null;

const elements = {
  token: document.getElementById('token'),
  authTitle: document.getElementById('auth-title'),
  authDescription: document.getElementById('auth-description'),
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
  tabs: document.getElementById('admin-tabs'),
  tabButtons: Array.from(document.querySelectorAll('[data-admin-tab]')),
  views: Array.from(document.querySelectorAll('[data-admin-view]')),
  activeView: document.getElementById('active-view'),
  tabActiveCount: document.getElementById('tab-active-count'),
  tabInvitationCount: document.getElementById('tab-invitation-count'),
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
  caseTabs: Array.from(document.querySelectorAll('[data-case-tab]')),
  caseViews: Array.from(document.querySelectorAll('[data-case-view]')),
  caseDocumentsCount: document.getElementById('case-documents-count'),
  caseDueCard: document.getElementById('case-due-card'),
  caseDueValue: document.getElementById('case-due-value'),
  caseDueNote: document.getElementById('case-due-note'),
  casePaymentCard: document.getElementById('case-payment-card'),
  casePaymentValue: document.getElementById('case-payment-value'),
  casePaymentNote: document.getElementById('case-payment-note'),
  caseMaterialsCard: document.getElementById('case-materials-card'),
  caseMaterialsValue: document.getElementById('case-materials-value'),
  caseMaterialsNote: document.getElementById('case-materials-note'),
  caseFulfillmentCard: document.getElementById('case-fulfillment-card'),
  caseFulfillmentValue: document.getElementById('case-fulfillment-value'),
  caseFulfillmentNote: document.getElementById('case-fulfillment-note'),
  nextAction: document.getElementById('case-next-action'),
  nextActionLabel: document.getElementById('case-next-action-label'),
  nextActionTitle: document.getElementById('case-next-action-title'),
  nextActionDescription: document.getElementById('case-next-action-description'),
  workflowButtons: Array.from(document.querySelectorAll('[data-workflow-action]')),
  caseMoreActions: document.getElementById('case-more-actions'),
  refreshCaseEvents: document.getElementById('refresh-case-events'),
  caseEventList: document.getElementById('case-event-list'),
  caseEventEmpty: document.getElementById('case-event-empty'),
  actionDialog: document.getElementById('case-action-dialog'),
  actionForm: document.getElementById('case-action-form'),
  actionType: document.getElementById('case-action-type'),
  actionDialogTitle: document.getElementById('case-action-dialog-title'),
  actionDialogDescription: document.getElementById('case-action-dialog-description'),
  actionAmountField: document.getElementById('case-action-amount-field'),
  actionAmount: document.getElementById('case-action-amount'),
  actionDeadlineField: document.getElementById('case-action-deadline-field'),
  actionDeadline: document.getElementById('case-action-deadline'),
  actionNote: document.getElementById('case-action-note'),
  actionConfirm: document.getElementById('case-action-confirm'),
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
  overviewDetails: document.getElementById('case-overview-details'),
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
  archiveDetails: document.getElementById('archive-details'),
  invitationsView: document.getElementById('invitations-view'),
  refreshInvitations: document.getElementById('refresh-invitations'),
  invitationLabel: document.getElementById('invitation-label'),
  createInvitation: document.getElementById('create-invitation'),
  generatedInvitation: document.getElementById('generated-invitation'),
  generatedInvitationUrl: document.getElementById('generated-invitation-url'),
  generatedInvitationExpiry: document.getElementById('generated-invitation-expiry'),
  copyInvitationUrl: document.getElementById('copy-invitation-url'),
  invitationStatActive: document.getElementById('invitation-stat-active'),
  invitationStatUsed: document.getElementById('invitation-stat-used'),
  invitationStatExpired: document.getElementById('invitation-stat-expired'),
  invitationStatRevoked: document.getElementById('invitation-stat-revoked'),
  invitationListCount: document.getElementById('invitation-list-count'),
  invitationList: document.getElementById('invitation-list'),
  invitationEmpty: document.getElementById('invitation-empty')
};


function setOperatorSessionActive(active) {
  document.body.classList.toggle('admin-session-active', active);

  if (elements.authTitle) {
    elements.authTitle.textContent = active
      ? 'Sesja operatora aktywna'
      : 'Dostęp do zgłoszeń';
  }

  if (elements.authDescription) {
    elements.authDescription.textContent = active
      ? 'Dane zostały pobrane. Użyj filtrów lub przycisku Odśwież w sekcji spraw.'
      : 'Wpisz token administratora, aby pobrać i aktualizować dane.';
  }
}

function showAdminView(name, { load = true } = {}) {
  activeAdminView = name;
  elements.views.forEach((view) => {
    view.hidden = view.dataset.adminView !== name;
  });
  elements.tabButtons.forEach((button) => {
    const active = button.dataset.adminTab === name;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });

  if (!load || !currentToken()) return;
  if (name === 'invitations') loadInvitations();
  if (name === 'archive') searchArchiveCases();
}

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

function formatMoneyMinor(value, currency = 'PLN') {
  const minor = Number(value);
  if (!Number.isFinite(minor)) return '—';

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: String(currency || 'PLN')
  }).format(minor / 100);
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
    elements.closeArchive,
    elements.refreshInvitations,
    elements.createInvitation,
    elements.copyInvitationUrl,
    elements.refreshCaseEvents,
    elements.actionConfirm
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

function appendDetailRow(label, value, container = elements.details) {
  const row = document.createElement('div');
  row.className = 'detail-row';

  const dt = document.createElement('dt');
  dt.textContent = label;

  const dd = document.createElement('dd');
  dd.textContent = text(value);

  row.append(dt, dd);
  container.append(row);
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


function caseFulfillmentState(item) {
  if (!item) return 'not_started';
  if (item.status === 'completed') return 'completed';
  if (item.status === 'in_progress' || item.fulfillment_started_at) return 'in_progress';
  if (item.payment_status === 'paid' && item.materials_status === 'complete') return 'ready';
  return 'not_started';
}

function daysUntil(value) {
  if (!value) return null;
  const diff = new Date(value).getTime() - Date.now();
  if (!Number.isFinite(diff)) return null;
  return Math.ceil(diff / 86_400_000);
}

function setGlanceCard(card, valueElement, noteElement, value, note, state = '') {
  valueElement.textContent = value;
  noteElement.textContent = note || '';
  card.className = `case-glance-card${state ? ` state-${state}` : ''}`;
}

function renderCaseGlance(item) {
  const dueDays = daysUntil(item.conditions_due_at);
  let dueValue = item.conditions_due_at ? formatDate(item.conditions_due_at) : 'Brak terminu';
  let dueNote = 'Starszy rekord lub termin nie został jeszcze zapisany.';
  let dueState = 'neutral';
  if (dueDays !== null) {
    if (dueDays < 0 && !['completed', 'rejected'].includes(item.status)) {
      dueNote = `Termin minął ${Math.abs(dueDays)} dni temu.`;
      dueState = 'danger';
    } else if (dueDays === 0) {
      dueNote = 'Termin upływa dzisiaj.';
      dueState = 'warning';
    } else {
      dueNote = `Pozostało ${dueDays} dni.`;
      dueState = dueDays <= 3 ? 'warning' : 'ok';
    }
  }
  setGlanceCard(elements.caseDueCard, elements.caseDueValue, elements.caseDueNote, dueValue, dueNote, dueState);

  const paymentLabel = PAYMENT_LABELS[item.payment_status] || item.payment_status || 'Nie ustawiono';
  const paymentNote = item.payment_status === 'paid'
    ? `${item.payment_received_at ? `Zaksięgowano: ${formatDate(item.payment_received_at)}` : 'Płatność oznaczona ręcznie'}${item.payment_amount_minor ? ` · ${formatMoneyMinor(item.payment_amount_minor, item.order_currency || 'PLN')}` : ''}`
    : PAYMENT_INSTRUCTION_LABELS[item.payment_instructions_status] || 'Oczekiwanie na przelew';
  setGlanceCard(
    elements.casePaymentCard,
    elements.casePaymentValue,
    elements.casePaymentNote,
    paymentLabel,
    paymentNote,
    item.payment_status === 'paid' ? 'ok' : item.payment_instructions_status === 'failed' ? 'danger' : 'warning'
  );

  const materials = item.materials_status || 'not_verified';
  const materialsNote = item.materials_updated_at
    ? `Aktualizacja: ${formatDate(item.materials_updated_at)}`
    : 'Sprawdź ankietę i dokumenty.';
  setGlanceCard(
    elements.caseMaterialsCard,
    elements.caseMaterialsValue,
    elements.caseMaterialsNote,
    MATERIAL_LABELS[materials] || materials,
    materialsNote,
    materials === 'complete' ? 'ok' : materials === 'incomplete' ? 'danger' : 'warning'
  );

  const fulfillment = caseFulfillmentState(item);
  const fulfillmentLabels = {
    not_started: 'Nierozpoczęta',
    ready: 'Warunki spełnione',
    in_progress: 'W realizacji',
    completed: 'Zakończona'
  };
  let fulfillmentNote = 'Wymaga płatności i kompletu materiałów.';
  if (fulfillment === 'ready') fulfillmentNote = 'Stan przejściowy — realizacja powinna rozpocząć się automatycznie.';
  if (fulfillment === 'in_progress') fulfillmentNote = item.fulfillment_started_at ? `Start: ${formatDate(item.fulfillment_started_at)}` : 'Realizacja została rozpoczęta.';
  if (fulfillment === 'completed') fulfillmentNote = item.fulfillment_completed_at ? `Zakończono: ${formatDate(item.fulfillment_completed_at)}` : 'Usługa została zakończona.';
  setGlanceCard(
    elements.caseFulfillmentCard,
    elements.caseFulfillmentValue,
    elements.caseFulfillmentNote,
    fulfillmentLabels[fulfillment],
    fulfillmentNote,
    fulfillment === 'completed' || fulfillment === 'ready' ? 'ok' : fulfillment === 'in_progress' ? 'active' : 'neutral'
  );
}

function showCaseView(name) {
  activeCaseView = name;
  elements.caseViews.forEach((view) => {
    view.hidden = view.dataset.caseView !== name;
  });
  elements.caseTabs.forEach((button) => {
    const active = button.dataset.caseTab === name;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });

  const item = selectedSubmission();
  if (
    name === 'documents' &&
    item &&
    attachmentsLoadedForId !== item.id &&
    attachmentsLoadedForId !== `loading:${item.id}`
  ) {
    attachmentsLoadedForId = `loading:${item.id}`;
    loadAttachments(item.id).catch((error) => {
      if (attachmentsLoadedForId === `loading:${item.id}`) attachmentsLoadedForId = null;
      setStatus(`Nie udało się pobrać dokumentów: ${error.message}`);
    });
  }
}

function buttonForAction(action) {
  return elements.workflowButtons.find((button) => button.dataset.workflowAction === action);
}

function renderWorkflowActions(item) {
  elements.workflowButtons.forEach((button) => {
    button.hidden = true;
    button.disabled = false;
  });

  const fulfillment = caseFulfillmentState(item);
  const closed = ['completed', 'rejected'].includes(item.status);
  const paymentInstructionStatus = item.payment_instructions_status || 'not_configured';
  const paymentConfigured = paymentInstructionStatus !== 'not_configured';

  if (!closed && item.payment_status !== 'paid' && item.payment_status !== 'refunded') {
    buttonForAction('mark_paid').hidden = false;
    buttonForAction('resend_payment_instructions').hidden = false;
    buttonForAction('resend_payment_instructions').disabled = !paymentConfigured;
  }
  if (!closed && item.payment_status === 'paid' && fulfillment !== 'in_progress') {
    buttonForAction('mark_refunded').hidden = false;
  }
  if (!closed && item.materials_status !== 'complete') {
    buttonForAction('materials_complete').hidden = false;
  }
  if (!closed && item.materials_status !== 'incomplete') {
    buttonForAction('materials_incomplete').hidden = false;
  }
  if (!closed && fulfillment === 'ready') {
    buttonForAction('start_fulfillment').hidden = false;
  }
  if (!closed && fulfillment === 'in_progress') {
    buttonForAction('complete_service').hidden = false;
  }
  if (!closed && fulfillment !== 'in_progress') buttonForAction('extend_deadline').hidden = false;
  if (!closed && fulfillment !== 'in_progress' && daysUntil(item.conditions_due_at) !== null && daysUntil(item.conditions_due_at) < 0) {
    buttonForAction('close_no_purchase').hidden = false;
  }

  if (elements.caseMoreActions) {
    const secondaryActions = [
      'materials_incomplete',
      'resend_payment_instructions',
      'mark_refunded',
      'extend_deadline',
      'close_no_purchase',
      'start_fulfillment'
    ];
    elements.caseMoreActions.hidden = secondaryActions.every((action) => buttonForAction(action).hidden);
    if (elements.caseMoreActions.hidden) elements.caseMoreActions.open = false;
  }

  elements.nextAction.className = 'case-next-action';
  elements.nextActionLabel.textContent = 'NASTĘPNY KROK';

  if (closed) {
    elements.nextActionTitle.textContent = item.status === 'completed' ? 'Usługa została zakończona' : 'Sprawa jest zamknięta';
    elements.nextActionDescription.textContent = 'Dalsze działania są dostępne wyłącznie w ustawieniach zaawansowanych.';
    elements.nextAction.classList.add('state-completed');
    return;
  }

  if (fulfillment === 'in_progress') {
    elements.nextActionTitle.textContent = 'Dokończ realizację usługi';
    elements.nextActionDescription.textContent = 'Po przygotowaniu projektu i przekazaniu go klientowi zakończ usługę. Uruchomi to 7-dniowy okres przed archiwizacją.';
    elements.nextAction.classList.add('state-active');
    return;
  }

  if (fulfillment === 'ready') {
    elements.nextActionTitle.textContent = 'Warunki są spełnione';
    elements.nextActionDescription.textContent = 'To stan przejściowy lub starszy rekord. Standardowo system rozpoczyna realizację automatycznie po potwierdzeniu drugiego warunku. W razie potrzeby użyj korekty w „Więcej działań”.';
    elements.nextAction.classList.add('state-ready');
    return;
  }

  const missing = [];
  if (item.payment_status !== 'paid') missing.push('zaksięgowania płatności');
  if (item.materials_status !== 'complete') missing.push('potwierdzenia kompletu materiałów');
  elements.nextActionTitle.textContent = `Oczekiwanie na ${missing.join(' i ')}`;
  elements.nextActionDescription.textContent = item.payment_instructions_status === 'not_configured'
    ? 'Dane do przelewu nie są jeszcze skonfigurowane w Workerze. Nie wysyłaj klientowi numeru rachunku z publicznego frontendu.'
    : 'Realizacja pozostaje zablokowana do czasu spełnienia obu warunków. Każdy warunek oznacz osobno po jego rzeczywistym potwierdzeniu.';
  elements.nextAction.classList.add(item.payment_instructions_status === 'failed' ? 'state-error' : 'state-waiting');
}

function eventDetailParts(event) {
  const details = event.details || {};
  const parts = [];
  if (details.amount_minor) parts.push(formatMoneyMinor(details.amount_minor, details.currency || 'PLN'));
  if (details.account_number_masked) parts.push(`rachunek: ${details.account_number_masked}`);
  if (details.transfer_title) parts.push(`tytuł: ${details.transfer_title}`);
  if (details.conditions_due_at) parts.push(`termin: ${formatDate(details.conditions_due_at)}`);
  if (details.deadline_at) parts.push(`nowy termin: ${formatDate(details.deadline_at)}`);
  if (details.previous_deadline_at) parts.push(`poprzednio: ${formatDate(details.previous_deadline_at)}`);
  if (details.note) parts.push(details.note);
  if (details.status) {
    parts.push(`Status: ${STATUS_LABELS[details.status.from] || details.status.from} → ${STATUS_LABELS[details.status.to] || details.status.to}`);
  }
  if (details.payment_status) {
    parts.push(`Płatność: ${PAYMENT_LABELS[details.payment_status.from] || details.payment_status.from} → ${PAYMENT_LABELS[details.payment_status.to] || details.payment_status.to}`);
  }
  if (details.closure_reason) {
    parts.push(`Zamknięcie: ${CLOSURE_LABELS[details.closure_reason.from] || details.closure_reason.from} → ${CLOSURE_LABELS[details.closure_reason.to] || details.closure_reason.to}`);
  }
  if (details.retention_hold) parts.push(`Blokada retencji: ${details.retention_hold.to ? 'włączona' : 'wyłączona'}`);
  if (details.admin_notes_changed) parts.push('Zmieniono notatki operatora.');
  if (details.error) parts.push(`Błąd: ${details.error}`);
  if (details.data_error) parts.push('Nie udało się odczytać szczegółów zdarzenia.');
  return parts;
}

function renderCaseEvents() {
  elements.caseEventList.replaceChildren();
  elements.caseEventEmpty.hidden = caseEvents.length !== 0;

  caseEvents.forEach((event) => {
    const row = document.createElement('article');
    row.className = 'case-event-row';
    const marker = document.createElement('span');
    marker.className = `case-event-marker event-${event.event_type}`;
    const body = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = EVENT_LABELS[event.event_type] || event.event_type;
    const date = document.createElement('time');
    date.dateTime = event.created_at;
    date.textContent = formatDate(event.created_at);
    body.append(title, date);
    const parts = eventDetailParts(event);
    if (parts.length) {
      const detail = document.createElement('p');
      detail.textContent = parts.join(' · ');
      body.append(detail);
    }
    row.append(marker, body);
    elements.caseEventList.append(row);
  });
}

function renderTechnicalOverview(item) {
  elements.overviewDetails.replaceChildren();
  appendDetailRow('Usługa', item.order_service, elements.overviewDetails);
  appendDetailRow('Cena zamówienia', formatMoneyMinor(item.order_price_gross_minor, item.order_currency), elements.overviewDetails);
  appendDetailRow('Zamówienie złożono', formatDate(item.order_accepted_at), elements.overviewDetails);
  appendDetailRow('Termin warunków', formatDate(item.conditions_due_at), elements.overviewDetails);
  appendDetailRow('Dane do przelewu', PAYMENT_INSTRUCTION_LABELS[item.payment_instructions_status] || item.payment_instructions_status, elements.overviewDetails);
  appendDetailRow('Wersja regulaminu', item.regulation_version, elements.overviewDetails);
  appendDetailRow('Wersja polityki prywatności', item.privacy_version, elements.overviewDetails);
  appendDetailRow('Wersja oświadczenia', item.contract_statement_version, elements.overviewDetails);
  appendDetailRow('Hash akceptacji', item.order_acceptance_hash, elements.overviewDetails);
  appendDetailRow('E-mail do klienta', EMAIL_STATUS_LABELS[item.client_email_status] || item.client_email_status, elements.overviewDetails);
  appendDetailRow('E-mail do administratora', EMAIL_STATUS_LABELS[item.admin_email_status] || item.admin_email_status, elements.overviewDetails);
  appendDetailRow('Aktualizacja wysyłki e-mail', formatDate(item.email_updated_at), elements.overviewDetails);
}

function renderDetails() {
  const item = selectedSubmission();

  if (!item) {
    elements.detailEmpty.hidden = false;
    elements.detailContent.hidden = true;
    currentAttachments = [];
    caseEvents = [];
    attachmentsLoadedForId = null;
    renderAttachmentList();
    renderCaseEvents();
    setSaveFeedback();
    return;
  }

  elements.detailEmpty.hidden = true;
  elements.detailContent.hidden = false;
  elements.caseReference.textContent = text(item.reference);
  elements.caseName.textContent = text(item.full_name);
  const closedInfo = item.closed_at ? ` · Zamknięto: ${formatDate(item.closed_at)}` : '';
  elements.caseDates.textContent =
    `Utworzono: ${formatDate(item.created_at)} · ` +
    `Ostatnia zmiana: ${formatDate(item.updated_at || item.created_at)}` +
    closedInfo;

  elements.caseStatusBadge.className = `status-badge status-${item.status}`;
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

  elements.toggleRead.textContent = item.is_read ? 'Oznacz jako nieprzeczytane' : 'Oznacz jako przeczytane';
  elements.retentionHold.checked = Boolean(item.retention_hold);
  elements.notes.value = String(item.admin_notes || '');
  elements.notesCounter.textContent = String(elements.notes.value.length);
  elements.caseDocumentsCount.textContent = String(Number(item.attachment_count || 0));

  setContactLink(elements.emailLink, 'mailto', item.email);
  setContactLink(elements.phoneLink, 'tel', item.phone);
  elements.copyEmail.disabled = !item.email;
  elements.copyPhone.disabled = !item.phone;

  renderCaseGlance(item);
  renderWorkflowActions(item);
  renderTechnicalOverview(item);
  renderCaseEvents();

  elements.details.replaceChildren();
  DETAIL_FIELDS.forEach(([key, label]) => appendDetailRow(label, item[key]));
  renderAttachmentList();
  showCaseView(activeCaseView);
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

    elements.tabs.hidden = false;
    elements.stats.hidden = false;
    elements.filters.hidden = false;
    elements.workspace.hidden = false;
    elements.dataTools.hidden = activeAdminView !== 'tools';
    elements.activeView.hidden = activeAdminView !== 'active';
    elements.invitationsView.hidden = activeAdminView !== 'invitations';
    elements.archiveSection.hidden = activeAdminView !== 'archive';
    setOperatorSessionActive(true);
    renderAll();
    setStatus(`Pobrano zgłoszenia: ${submissions.length}.`, 'success');
  } catch (error) {
    submissions = [];
    selectedId = null;
    setOperatorSessionActive(false);
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
  caseEvents = [];
  attachmentsLoadedForId = null;
  activeCaseView = 'workflow';
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

    await loadCaseEvents(id);
  } catch (error) {
    setStatus(`Nie udało się otworzyć pełnych danych sprawy: ${error.message}`);
  }
}

async function loadCaseEvents(id = selectedId) {
  if (!id) return;
  const payload = await apiRequest(`/submissions/${encodeURIComponent(id)}/events`);
  if (selectedId !== id) return;
  caseEvents = Array.isArray(payload.items) ? payload.items : [];
  renderCaseEvents();
}

function actionDialogConfig(action, item) {
  const configs = {
    mark_paid: {
      title: 'Oznacz płatność jako zaksięgowaną',
      description: 'Potwierdź tę operację dopiero po rzeczywistym wpływie środków na rachunek.',
      confirm: 'Zapisz płatność',
      amount: true
    },
    mark_refunded: {
      title: 'Oznacz zwrot płatności i zamknij sprawę',
      description: 'Użyj przed rozpoczęciem realizacji, po rzeczywistym zwrocie środków. Sprawa zostanie zamknięta ze sposobem „Zwrot płatności”.',
      confirm: 'Potwierdź zwrot i zamknij'
    },
    materials_complete: {
      title: 'Potwierdź komplet materiałów',
      description: 'Użyj po sprawdzeniu ankiety oraz wszystkich wymaganych dokumentów.',
      confirm: 'Materiały są kompletne'
    },
    materials_incomplete: {
      title: 'Oznacz braki w materiałach',
      description: 'W notatce wpisz krótko, czego brakuje. Informacja pozostanie w historii operatora.',
      confirm: 'Zapisz braki'
    },
    start_fulfillment: {
      title: 'Napraw rozpoczęcie realizacji',
      description: 'Funkcja awaryjna dla starszej sprawy, w której płatność i materiały są już potwierdzone, ale realizacja nie rozpoczęła się automatycznie.',
      confirm: 'Napraw stan sprawy'
    },
    complete_service: {
      title: 'Zakończ usługę',
      description: 'Sprawa zostanie zamknięta jako wykonana i zaplanowana do archiwizacji po 7 dniach.',
      confirm: 'Zakończ usługę'
    },
    resend_payment_instructions: {
      title: 'Wyślij ponownie dane do przelewu',
      description: 'Klient otrzyma ponownie potwierdzenie zamówienia wraz z numerem rachunku, kwotą, tytułem przelewu i terminem.',
      confirm: 'Wyślij wiadomość'
    },
    close_no_purchase: {
      title: 'Zamknij sprawę — warunki niespełnione',
      description: 'Użyj po upływie terminu, gdy klient nie dokonał płatności albo nie przekazał kompletu materiałów. Sprawa zostanie zamknięta z 30-dniowym okresem retencji.',
      confirm: 'Zamknij sprawę'
    },
    extend_deadline: {
      title: 'Przedłuż termin płatności i materiałów',
      description: 'Wybierz termin uzgodniony indywidualnie z klientem.',
      confirm: 'Przedłuż termin',
      deadline: true
    }
  };
  const config = configs[action] || null;
  if (config?.amount) {
    const minor = Number(item?.order_price_gross_minor || 200000);
    elements.actionAmount.value = (minor / 100).toFixed(2);
  }
  if (config?.deadline) {
    const base = item?.conditions_due_at ? new Date(item.conditions_due_at) : new Date();
    base.setDate(base.getDate() + 7);
    const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    elements.actionDeadline.value = local;
  }
  return config;
}

function openWorkflowDialog(action) {
  const item = selectedSubmission();
  if (!item || !elements.actionDialog) return;
  const config = actionDialogConfig(action, item);
  if (!config) return;
  elements.actionType.value = action;
  elements.actionDialogTitle.textContent = config.title;
  elements.actionDialogDescription.textContent = config.description;
  elements.actionConfirm.textContent = config.confirm;
  elements.actionAmountField.hidden = !config.amount;
  elements.actionDeadlineField.hidden = !config.deadline;
  elements.actionNote.value = '';
  elements.actionDialog.showModal();
}

async function runWorkflowAction(action, extra = {}) {
  const item = selectedSubmission();
  if (!item || requestInProgress) return;
  setBusy(true);
  setStatus('Zapisywanie działania…', 'success');
  try {
    await apiRequest(`/submissions/${encodeURIComponent(item.id)}/workflow`, {
      method: 'POST',
      body: JSON.stringify({ action, ...extra })
    });
    await loadSubmissions({ preserveSelection: true, force: true });
    await loadCaseEvents(item.id);
    setStatus('Działanie zostało zapisane w historii sprawy.', 'success');
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
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
  const selected = selectedSubmission();
  if (selected && elements.caseDocumentsCount) {
    elements.caseDocumentsCount.textContent = String(Number(selected.attachment_count || currentAttachments.length || 0));
  }
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
  attachmentsLoadedForId = submissionId;
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
  showAdminView('archive');
}

function closeArchiveView() {
  showAdminView('active', { load: false });
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
  appendArchiveRow(elements.archiveDetails, 'Usługa', item.order_service);
  appendArchiveRow(elements.archiveDetails, 'Cena zamówienia', formatMoneyMinor(item.order_price_gross_minor, item.order_currency));
  appendArchiveRow(elements.archiveDetails, 'Zamówienie złożono', formatDate(item.order_accepted_at));
  appendArchiveRow(elements.archiveDetails, 'Wersja regulaminu', item.regulation_version);
  appendArchiveRow(elements.archiveDetails, 'Wersja polityki prywatności', item.privacy_version);
  appendArchiveRow(elements.archiveDetails, 'Wersja oświadczenia', item.contract_statement_version);
  appendArchiveRow(elements.archiveDetails, 'Hash akceptacji', item.order_acceptance_hash);
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


function invitationLabel(status) {
  return {
    active: 'Aktywny',
    used: 'Wykorzystany',
    expired: 'Wygasły',
    revoked: 'Unieważniony'
  }[status] || status;
}

function renderInvitationStats(summary = {}) {
  elements.invitationStatActive.textContent = String(summary.active || 0);
  elements.invitationStatUsed.textContent = String(summary.used || 0);
  elements.invitationStatExpired.textContent = String(summary.expired || 0);
  elements.invitationStatRevoked.textContent = String(summary.revoked || 0);
  elements.tabInvitationCount.textContent = String(summary.active || 0);
}

function renderInvitations() {
  elements.invitationList.replaceChildren();
  elements.invitationListCount.textContent = String(invitations.length);
  elements.invitationEmpty.hidden = invitations.length !== 0;

  invitations.forEach((item) => {
    const row = document.createElement('article');
    row.className = `invitation-row invitation-${item.status}`;

    const main = document.createElement('div');
    main.className = 'invitation-row-main';
    const title = document.createElement('strong');
    title.textContent = item.label || 'Link bez etykiety';
    const meta = document.createElement('span');
    meta.textContent = `Utworzono: ${formatDate(item.created_at)} · Ważny do: ${formatDate(item.expires_at)}`;
    main.append(title, meta);

    if (item.submission_reference) {
      const reference = document.createElement('span');
      reference.textContent = `Zgłoszenie: ${item.submission_reference}`;
      main.append(reference);
    }

    const actions = document.createElement('div');
    actions.className = 'invitation-row-actions';
    const badge = document.createElement('span');
    badge.className = `invitation-status invitation-status-${item.status}`;
    badge.textContent = invitationLabel(item.status);
    actions.append(badge);

    if (item.status === 'active') {
      const revoke = document.createElement('button');
      revoke.type = 'button';
      revoke.className = 'button admin-danger-button';
      revoke.textContent = 'Unieważnij';
      revoke.addEventListener('click', () => revokeInvitation(item));
      actions.append(revoke);
    }

    row.append(main, actions);
    elements.invitationList.append(row);
  });
}

async function loadInvitations({ force = false } = {}) {
  if ((requestInProgress && !force) || !currentToken()) return;
  setBusy(true);
  setStatus('Pobieranie linków do ankiety…', 'success');
  try {
    const payload = await apiRequest('/admin/invitations');
    invitations = Array.isArray(payload.items) ? payload.items : [];
    renderInvitationStats(payload.summary || {});
    renderInvitations();
    setStatus(`Pobrano linki do ankiety: ${invitations.length}.`, 'success');
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function createInvitation() {
  if (requestInProgress || !currentToken()) return;
  setBusy(true);
  setStatus('Generowanie prywatnego linku…', 'success');
  try {
    const payload = await apiRequest('/admin/invitations', {
      method: 'POST',
      body: JSON.stringify({ label: elements.invitationLabel.value.trim() })
    });

    elements.generatedInvitationUrl.value = payload.invite_url || '';
    elements.generatedInvitationExpiry.textContent = payload.item?.expires_at
      ? `Ważny do: ${formatDate(payload.item.expires_at)}.`
      : '';
    elements.generatedInvitation.hidden = false;
    elements.invitationLabel.value = '';
    await loadInvitations({ force: true });
    setStatus('Prywatny link został utworzony. Skopiuj go przed odświeżeniem panelu.', 'success');
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function copyInvitationUrl() {
  const value = elements.generatedInvitationUrl.value.trim();
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    setStatus('Link do ankiety został skopiowany.', 'success');
  } catch {
    elements.generatedInvitationUrl.select();
    setStatus('Zaznaczony link skopiuj skrótem Ctrl+C.', 'success');
  }
}

async function revokeInvitation(item) {
  if (!window.confirm(`Unieważnić link „${item.label || 'bez etykiety'}”?`)) return;
  setBusy(true);
  try {
    await apiRequest(`/admin/invitations/${encodeURIComponent(item.id)}`, {
      method: 'DELETE'
    });
    await loadInvitations({ force: true });
    setStatus('Link został unieważniony.', 'success');
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

function clearSession() {
  setOperatorSessionActive(false);
  elements.token.value = '';
  submissions = [];
  selectedId = null;
  currentAttachments = [];
  archiveItems = [];
  archiveSelectedId = null;
  archiveSelectedItem = null;
  invitations = [];
  activeAdminView = 'active';
  activeCaseView = 'workflow';
  caseEvents = [];
  attachmentsLoadedForId = null;
  elements.search.value = '';
  elements.statusFilter.value = 'all';
  elements.readFilter.value = 'all';
  elements.sortOrder.value = 'newest';
  elements.tabs.hidden = true;
  elements.dataTools.hidden = true;
  elements.retentionReport.hidden = true;
  elements.stats.hidden = true;
  elements.filters.hidden = true;
  elements.workspace.hidden = true;
  elements.archiveSection.hidden = true;
  elements.invitationsView.hidden = true;
  elements.activeView.hidden = true;
  elements.generatedInvitation.hidden = true;
  elements.generatedInvitationUrl.value = '';
  renderInvitationStats();
  renderInvitations();
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
if (elements.openArchive) elements.openArchive.addEventListener('click', showArchiveView);
if (elements.closeArchive) elements.closeArchive.addEventListener('click', closeArchiveView);
elements.tabButtons.forEach((button) => {
  button.addEventListener('click', () => showAdminView(button.dataset.adminTab));
});
elements.refreshInvitations.addEventListener('click', loadInvitations);
elements.createInvitation.addEventListener('click', createInvitation);
elements.copyInvitationUrl.addEventListener('click', copyInvitationUrl);
elements.searchArchive.addEventListener('click', searchArchiveCases);
elements.archiveSearch.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') searchArchiveCases();
});
elements.uploadAttachment.addEventListener('click', uploadAttachment);
elements.saveCase.addEventListener('click', saveCase);
elements.toggleRead.addEventListener('click', toggleRead);
elements.deleteCase.addEventListener('click', deleteCase);
elements.caseTabs.forEach((button) => {
  button.addEventListener('click', () => showCaseView(button.dataset.caseTab));
});
elements.workflowButtons.forEach((button) => {
  button.addEventListener('click', () => openWorkflowDialog(button.dataset.workflowAction));
});
if (elements.refreshCaseEvents) {
  elements.refreshCaseEvents.addEventListener('click', () => loadCaseEvents());
}
if (elements.actionForm) {
  elements.actionForm.addEventListener('submit', (event) => {
    const submitter = event.submitter;
    if (!submitter || submitter.value === 'cancel') return;
    event.preventDefault();
    const action = elements.actionType.value;
    const payload = { note: elements.actionNote.value.trim() };
    if (action === 'mark_paid') {
      const amount = Number(elements.actionAmount.value);
      if (!Number.isFinite(amount) || amount <= 0) {
        setStatus('Podaj prawidłową kwotę płatności.');
        return;
      }
      payload.amount_minor = Math.round(amount * 100);
    }
    if (action === 'extend_deadline') {
      if (!elements.actionDeadline.value) {
        setStatus('Wybierz nowy termin.');
        return;
      }
      payload.deadline_at = new Date(elements.actionDeadline.value).toISOString();
    }
    elements.actionDialog.close();
    runWorkflowAction(action, payload);
  });
}
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
