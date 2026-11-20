const API_BASE = 'https://api.pogotowieupadlosciowe.pl';
const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const REQUEST_ID_STORAGE_KEY = 'pu-active-submission-request-id-v1';
const INVITATION_TOKEN = new URLSearchParams(window.location.search).get('token') || '';
const PREVIEW_HOST_SUFFIXES = Object.freeze(['.pages.dev', '.chatgpt.site']);
const DEMO_MODE =
  ['localhost', '127.0.0.1'].includes(window.location.hostname) ||
  PREVIEW_HOST_SUFFIXES.some((suffix) => window.location.hostname.endsWith(suffix));

const FALLBACK_ORDER_CONFIG = Object.freeze({
  schema_version: 2,
  service_code: 'consumer-bankruptcy-application-project',
  service_name: 'Przygotowanie projektu wniosku o ogłoszenie upadłości konsumenckiej',
  price_gross_minor: 200000,
  currency: 'PLN',
  price_display: '2 000 zł',
  fulfillment_text: 'Do 3 dni roboczych od otrzymania kompletu wymaganych informacji i dokumentów oraz zaksięgowania płatności',
  revisions_text: 'Bezpłatne poprawki przy weryfikacji projektu wniosku',
  scope_note: 'Usługa nie obejmuje porad prawnych ani reprezentacji. Dane do płatności zostaną przekazane e-mailem po potwierdzeniu przyjęcia zamówienia.',
  regulation_version: 'REG-2026-09-16-01',
  privacy_version: 'PP-2026-09-16-01',
  contract_statement_version: 'OSW-2026-09-16-01'
});

// Treści widoczne dla klienta są utrzymywane razem z publiczną stroną i
// dokumentami. Worker pozostaje źródłem danych technicznych zamówienia,
// aktualnej ceny liczbowej oraz wersji dokumentów.
const ORDER_DISPLAY_COPY = Object.freeze({
  service_name: FALLBACK_ORDER_CONFIG.service_name,
  fulfillment_text: FALLBACK_ORDER_CONFIG.fulfillment_text,
  revisions_text: FALLBACK_ORDER_CONFIG.revisions_text,
  scope_note: FALLBACK_ORDER_CONFIG.scope_note
});

const form = document.getElementById('ankieta-form');
const button = document.getElementById('submit-button');
const statusBox = document.getElementById('form-status');
const turnstileBox = document.getElementById('turnstile-widget');
const turnstileStatus = document.getElementById('turnstile-status');
const invitationGate = document.getElementById('invitation-gate');
const invitationGateTitle = document.getElementById('invitation-gate-title');
const invitationGateMessage = document.getElementById('invitation-gate-message');
const invitationExpiry = document.getElementById('invitation-expiry');
const attachmentUploadBox = document.getElementById('attachment-upload');
const attachmentInput = document.getElementById('attachment-files');
const attachmentHelp = document.getElementById('attachment-help');
const attachmentList = document.getElementById('attachment-list');
const attachmentStatus = document.getElementById('attachment-status');
const specialCategoryConsentQuestion = document.getElementById('special-category-consent-question');
const specialCategoryConsent = document.getElementById('special_category_consent');
const specialCategoryChoices = Array.from(
  document.querySelectorAll('input[name="includes_special_category_data"]')
);

let turnstileWidgetId = null;
let turnstileToken = '';
let securityReady = false;
let orderConfig = null;
let memoryRequestId = '';
let invitationValidated = false;
let attachmentConfig = {
  enabled: false,
  maxBytes: 10 * 1024 * 1024,
  maxCount: 20,
  allowedTypes: new Set()
};
let pendingAttachmentUpload = null;
let savedSubmissionMessage = '';


function formatInvitationDate(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Europe/Warsaw'
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function showInvitationGate(title, message, type = '', expiresAt = null) {
  invitationGateTitle.textContent = title;
  invitationGateMessage.textContent = message;
  invitationGate.className = `invitation-gate ${type}`.trim();
  invitationExpiry.textContent = expiresAt
    ? `Dostęp do ankiety jest ważny do: ${formatInvitationDate(expiresAt)}.`
    : '';
}

const ATTACHMENT_MIME_BY_EXTENSION = Object.freeze({
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
});

function formatAttachmentSize(bytes) {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes < 0.1 ? '< 0,1' : megabytes.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} MB`;
}

function normalizedUploadFilename(filename) {
  return String(filename || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/]+/g, '-')
    .trim()
    .slice(0, 180);
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function createAttachmentUploadId(submissionId, file) {
  if (!window.crypto?.subtle || typeof file.arrayBuffer !== 'function') {
    throw new Error('Ta przeglądarka nie może bezpiecznie przygotować pliku. Zaktualizuj przeglądarkę i spróbuj ponownie.');
  }

  const fileBytes = await file.arrayBuffer();
  const fileDigest = bytesToHex(new Uint8Array(await window.crypto.subtle.digest('SHA-256', fileBytes)));
  const requestText = `${submissionId}|${normalizedUploadFilename(file.name)}|${fileDigest}`;
  const requestBytes = new TextEncoder().encode(requestText);
  return bytesToHex(new Uint8Array(await window.crypto.subtle.digest('SHA-256', requestBytes)));
}

function attachmentContentType(file) {
  const extension = String(file.name || '').split('.').pop().toLowerCase();
  return ATTACHMENT_MIME_BY_EXTENSION[extension] || String(file.type || '').toLowerCase();
}

function validateAttachmentFiles(files) {
  if (!files.length) return '';
  if (!attachmentConfig.enabled) return 'Przesyłanie załączników jest obecnie niedostępne.';
  if (files.length > attachmentConfig.maxCount) {
    return `Możesz dołączyć maksymalnie ${attachmentConfig.maxCount} plików.`;
  }

  for (const file of files) {
    const contentType = attachmentContentType(file);
    if (!attachmentConfig.allowedTypes.has(contentType)) {
      return `„${file.name}” ma niedozwolony format. Wybierz PDF, JPG, PNG, HEIC/HEIF lub DOCX.`;
    }
    if (!file.size) return `„${file.name}” jest pusty.`;
    if (file.size > attachmentConfig.maxBytes) {
      return `„${file.name}” przekracza limit ${formatAttachmentSize(attachmentConfig.maxBytes)}.`;
    }
  }

  return '';
}

function formatAttachmentCount(count) {
  const lastTwo = count % 100;
  const lastDigit = count % 10;
  if (count === 1) return 'plik';
  if (lastTwo < 12 || lastTwo > 14) {
    if (lastDigit >= 2 && lastDigit <= 4) return 'pliki';
  }
  return 'plików';
}

function renderAttachmentList() {
  if (!attachmentList || !attachmentInput) return;
  attachmentList.replaceChildren();
  Array.from(attachmentInput.files || []).forEach((file) => {
    const item = document.createElement('li');
    item.textContent = `${file.name} · ${formatAttachmentSize(file.size)}`;
    attachmentList.append(item);
  });
}

function applyAttachmentConfig(config) {
  if (!attachmentUploadBox || !attachmentInput) return;

  const attachmentSettings = config.attachments && typeof config.attachments === 'object'
    ? config.attachments
    : {};
  const allowedTypes = attachmentSettings.types && typeof attachmentSettings.types === 'object'
    ? Object.keys(attachmentSettings.types).map((type) => String(type).toLowerCase())
    : Object.values(ATTACHMENT_MIME_BY_EXTENSION);
  const maxBytes = Number(attachmentSettings.max_file_bytes);
  const maxCount = Number(attachmentSettings.max_files);

  attachmentConfig = {
    enabled: attachmentSettings.enabled === true,
    maxBytes: Number.isFinite(maxBytes) && maxBytes > 0 ? maxBytes : 10 * 1024 * 1024,
    maxCount: Number.isFinite(maxCount) && maxCount > 0 ? maxCount : 20,
    allowedTypes: new Set(allowedTypes)
  };

  attachmentUploadBox.hidden = !attachmentConfig.enabled;
  attachmentInput.disabled = !attachmentConfig.enabled;
  if (attachmentConfig.enabled && attachmentHelp) {
    attachmentHelp.textContent = `Dodaj dokumenty potrzebne do przygotowania projektu wniosku. Możesz załączyć do ${attachmentConfig.maxCount} plików PDF, JPG, PNG, HEIC/HEIF lub DOCX; maksymalny rozmiar jednego pliku to ${formatAttachmentSize(attachmentConfig.maxBytes)}. Wysyłamy je w oryginalnej jakości.`;
  }
}

const MAX_ATTACHMENT_UPLOAD_ATTEMPTS = 3;
const RETRYABLE_ATTACHMENT_HTTP_STATUSES = new Set([408, 425, 429]);

function waitBeforeAttachmentRetry(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function uploadAttachmentFile(file, uploadId, index, total) {
  for (let attempt = 1; attempt <= MAX_ATTACHMENT_UPLOAD_ATTEMPTS; attempt += 1) {
    let response;
    try {
      response = await fetch(`${API_BASE}/submission-attachments`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        headers: {
          'Content-Type': attachmentContentType(file),
          'X-File-Name': encodeURIComponent(file.name),
          'X-Invitation-Token': INVITATION_TOKEN,
          'X-Upload-Id': uploadId
        },
        body: file
      });
    } catch {
      if (attempt === MAX_ATTACHMENT_UPLOAD_ATTEMPTS) {
        throw new Error(`Nie udało się wysłać pliku „${file.name}” z powodu problemu z połączeniem.`);
      }
      if (attachmentStatus) {
        attachmentStatus.textContent = `Chwilowy problem z połączeniem. Automatycznie ponawiamy wysyłkę dokumentu ${index + 1} z ${total}…`;
      }
      await waitBeforeAttachmentRetry(800 * attempt);
      continue;
    }

    let payload = {};
    try {
      payload = await response.json();
    } catch {
      // A successful response can still be accepted when it has no JSON body.
    }
    if (response.ok) return;

    const isRetryable =
      RETRYABLE_ATTACHMENT_HTTP_STATUSES.has(response.status) || response.status >= 500;
    const errorMessage = payload.error || `błąd HTTP ${response.status}`;
    if (!isRetryable || attempt === MAX_ATTACHMENT_UPLOAD_ATTEMPTS) {
      throw new Error(`${file.name}: ${errorMessage}`);
    }

    if (attachmentStatus) {
      attachmentStatus.textContent = `Chwilowy problem z serwerem. Automatycznie ponawiamy wysyłkę dokumentu ${index + 1} z ${total}…`;
    }
    await waitBeforeAttachmentRetry(800 * attempt);
  }
}

async function uploadPendingAttachments() {
  if (!pendingAttachmentUpload) return;
  const { submissionId, files, uploadedIndexes, uploadIds } = pendingAttachmentUpload;
  let completed = uploadedIndexes.size;

  for (let index = 0; index < files.length; index += 1) {
    if (uploadedIndexes.has(index)) continue;
    const file = files[index];
    if (!uploadIds[index]) {
      uploadIds[index] = await createAttachmentUploadId(submissionId, file);
    }
    if (attachmentStatus) {
      attachmentStatus.textContent = `Wysyłamy dokument ${index + 1} z ${files.length}: ${file.name}`;
    }

    await uploadAttachmentFile(file, uploadIds[index], index, files.length);
    uploadedIndexes.add(index);
    completed += 1;
    if (attachmentStatus) {
      attachmentStatus.textContent = `Wysłano ${completed} z ${files.length} dokumentów.`;
    }
  }
}

function lockSubmittedForm() {
  Array.from(form.elements).forEach((element) => { element.disabled = true; });
  button.disabled = true;
}

function finalizeSavedSubmission() {
  const attachmentCount = pendingAttachmentUpload?.files.length || 0;
  pendingAttachmentUpload = null;
  clearActiveRequestId();
  window.history.replaceState({}, document.title, window.location.pathname);
  form.reset();
  attachmentList?.replaceChildren();
  lockSubmittedForm();
  button.textContent = 'Ankieta wysłana';
  if (attachmentCount && attachmentStatus) {
    attachmentStatus.textContent = 'Dokumenty dołączono do tej sprawy.';
  }
  const attachmentInfo = attachmentCount
    ? ' Dokumenty dołączono do tej sprawy.'
    : '';
  showStatus(`${savedSubmissionMessage}${attachmentInfo}`, 'success');
}

if (attachmentInput) {
  attachmentInput.addEventListener('change', () => {
    const files = Array.from(attachmentInput.files || []);
    const error = validateAttachmentFiles(files);
    if (error) {
      attachmentInput.value = '';
      renderAttachmentList();
      if (attachmentStatus) attachmentStatus.textContent = error;
      return;
    }
    renderAttachmentList();
    if (attachmentStatus) {
      attachmentStatus.textContent = files.length
        ? `Wybrano ${files.length} ${formatAttachmentCount(files.length)}. Po wysłaniu ankiety dołączymy ${files.length === 1 ? 'go' : 'je'} do Twojej sprawy.`
        : 'Możesz dodać dokumenty, które pomogą nam przygotować projekt wniosku.';
    }
  });
}

async function validateInvitation() {
  if (!/^[A-Za-z0-9_-]{43}$/.test(INVITATION_TOKEN)) {
    showInvitationGate(
      'Ankieta wymaga indywidualnego linku',
      'Ta ankieta jest dostępna tylko przez indywidualny link otrzymany po rozmowie wstępnej.',
      'error'
    );
    return false;
  }

  try {
    const response = await fetch(`${API_BASE}/form-invitations/validate`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: INVITATION_TOKEN,
        request_id: getActiveRequestId()
      })
    });

    const payload = await response.json();
    if (!response.ok || !payload.valid) {
      const accessMessage = payload.message || payload.error ||
        'Ten link jest nieprawidłowy, wygasł albo został już wykorzystany.';
      showInvitationGate(
        'Brak dostępu do ankiety',
        `${accessMessage} Jeśli link powinien być nadal aktywny, skontaktuj się z nami, aby otrzymać nowy dostęp do ankiety.`,
        'error',
        payload.expires_at
      );
      return false;
    }

    invitationValidated = true;
    showInvitationGate(
      'Dostęp potwierdzony',
      payload.duplicate_retry
        ? 'Wykryliśmy wcześniejszą próbę wysłania ankiety. Jeśli zgłoszenie dotarło, system nie utworzy drugiej sprawy.'
        : 'Dostęp do ankiety jest aktywny. Możesz ją teraz wypełnić.',
      'success',
      payload.expires_at
    );
    form.hidden = false;
    return true;
  } catch (error) {
    showInvitationGate(
      'Nie udało się sprawdzić dostępu do ankiety',
      'Odśwież stronę i spróbuj ponownie. Jeśli problem się powtarza, skontaktuj się z nami.',
      'error'
    );
    return false;
  }
}

function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `form-status ${type}`;
}

function showTurnstileStatus(message, type = '') {
  turnstileStatus.textContent = message;
  turnstileStatus.className = `field-help turnstile-message ${type}`.trim();
}

function setButtonReady(ready) {
  securityReady = ready;
  button.disabled = !ready;
  button.textContent = ready
    ? (DEMO_MODE ? 'Sprawdź wysłanie — tryb demo' : 'Zamawiam z obowiązkiem zapłaty')
    : 'Przygotowujemy formularz…';
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element && value) element.textContent = value;
}

function syncSpecialCategoryConsent() {
  const selectedChoice = specialCategoryChoices.find((choice) => choice.checked);
  const consentRequired = selectedChoice?.value === 'yes';

  specialCategoryConsentQuestion.hidden = !consentRequired;
  specialCategoryConsent.required = consentRequired;
  specialCategoryConsent.setAttribute('aria-required', String(consentRequired));

  if (!consentRequired) specialCategoryConsent.checked = false;
}

function formatOrderPrice(priceGrossMinor, currency) {
  const minorUnits = Number(priceGrossMinor);
  if (!Number.isSafeInteger(minorUnits) || minorUnits < 0 || currency !== 'PLN') {
    return FALLBACK_ORDER_CONFIG.price_display;
  }

  const wholeUnits = Math.floor(minorUnits / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const remainder = minorUnits % 100;
  return remainder
    ? `${wholeUnits},${String(remainder).padStart(2, '0')} zł`
    : `${wholeUnits} zł`;
}

function applyOrderConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Nie udało się załadować danych zamówienia. Odśwież stronę i spróbuj ponownie.');
  }

  const required = [
    'schema_version',
    'service_code',
    'service_name',
    'price_gross_minor',
    'currency',
    'price_display',
    'regulation_version',
    'privacy_version',
    'contract_statement_version'
  ];

  if (required.some((key) => config[key] === undefined || config[key] === null || config[key] === '')) {
    throw new Error('Nie udało się załadować wszystkich danych zamówienia. Odśwież stronę i spróbuj ponownie.');
  }

  orderConfig = Object.freeze({ ...config });
  setText('order-service-name', ORDER_DISPLAY_COPY.service_name);
  setText('order-price-display', formatOrderPrice(config.price_gross_minor, config.currency));
  setText('order-fulfillment-text', ORDER_DISPLAY_COPY.fulfillment_text);
  setText('order-revisions-text', ORDER_DISPLAY_COPY.revisions_text);
  setText('order-scope-note', ORDER_DISPLAY_COPY.scope_note);
  setText('regulation-version-display', config.regulation_version);
  setText('privacy-version-display', config.privacy_version);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function createRequestId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function getActiveRequestId() {
  try {
    const stored = sessionStorage.getItem(REQUEST_ID_STORAGE_KEY);
    if (isUuid(stored)) return stored;
  } catch {
    // Session storage may be unavailable in restrictive browser modes.
  }

  if (isUuid(memoryRequestId)) return memoryRequestId;

  const requestId = createRequestId();
  memoryRequestId = requestId;

  try {
    sessionStorage.setItem(REQUEST_ID_STORAGE_KEY, requestId);
  } catch {
    // In-memory fallback remains active.
  }

  return requestId;
}

function clearActiveRequestId() {
  memoryRequestId = '';
  try {
    sessionStorage.removeItem(REQUEST_ID_STORAGE_KEY);
  } catch {
    // Nothing else to do.
  }
}

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src^="${TURNSTILE_SCRIPT_URL.split('?')[0]}"]`
    );

    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(
      new Error('Nie udało się załadować zabezpieczenia formularza.')
    );
    document.head.appendChild(script);
  });
}

function resetTurnstile(message = 'Odnawiamy zabezpieczenie formularza…') {
  turnstileToken = '';
  setButtonReady(false);
  showTurnstileStatus(message);

  if (window.turnstile && turnstileWidgetId !== null) {
    window.turnstile.reset(turnstileWidgetId);
  }
}

function initializeDemoMode() {
  document.body.classList.add('demo-mode');
  invitationValidated = true;
  applyOrderConfig(FALLBACK_ORDER_CONFIG);
  form.hidden = false;
  turnstileBox.hidden = true;
  showInvitationGate(
    'Tryb demonstracyjny ankiety',
    'Możesz swobodnie uzupełniać i sprawdzać formularz. Żadne wpisane dane nie zostaną wysłane, a zamówienie nie zostanie utworzone.',
    'success'
  );
  showTurnstileStatus(
    'Podgląd demonstracyjny nie wysyła danych i nie wymaga zabezpieczenia formularza.',
    'success'
  );
  setButtonReady(true);
}

async function initializeSecurity() {
  setButtonReady(false);

  if (DEMO_MODE) {
    initializeDemoMode();
    return;
  }

  const invitationOk = await validateInvitation();
  if (!invitationOk) {
    showTurnstileStatus('Weryfikacja bezpieczeństwa rozpocznie się po potwierdzeniu linku.');
    return;
  }
  showTurnstileStatus('Ładowanie zabezpieczenia formularza…');

  try {
    const response = await fetch(`${API_BASE}/public-config`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer'
    });

    const config = await response.json();

    if (!response.ok) {
      throw new Error(config.error || 'Nie udało się pobrać konfiguracji formularza.');
    }

    if (!config.form_enabled) {
      throw new Error('Formularz jest obecnie wyłączony.');
    }

    if (!config.turnstile_enabled || !config.turnstile_site_key) {
      throw new Error('Weryfikacja bezpieczeństwa nie została jeszcze skonfigurowana.');
    }

    applyOrderConfig(config.order || FALLBACK_ORDER_CONFIG);
    applyAttachmentConfig(config);
    await loadTurnstileScript();

    turnstileWidgetId = window.turnstile.render(turnstileBox, {
      sitekey: config.turnstile_site_key,
      theme: 'auto',
      size: 'normal',
      action: 'submit_ankieta',
      callback(token) {
        turnstileToken = token;
        setButtonReady(true);
        showTurnstileStatus('Zabezpieczenie formularza jest gotowe.', 'success');
      },
      'expired-callback'() {
        resetTurnstile('Zabezpieczenie formularza wygasło. Odnawiamy je automatycznie…');
      },
      'timeout-callback'() {
        resetTurnstile('Zabezpieczenie formularza wymaga ponownej weryfikacji.');
      },
      'error-callback'() {
        turnstileToken = '';
        setButtonReady(false);
        showTurnstileStatus(
          'Nie udało się potwierdzić zabezpieczenia formularza. Spróbuj ponownie.',
          'error'
        );
      }
    });
  } catch (error) {
    setButtonReady(false);
    showTurnstileStatus(error.message, 'error');
    showStatus(error.message, 'error');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusBox.className = 'form-status';

  if (!form.reportValidity()) return;

  if (DEMO_MODE) {
    button.disabled = true;
    button.textContent = 'Sprawdzanie ankiety…';
    showStatus(
      'Test zakończony poprawnie. Żadne dane nie zostały wysłane i nie utworzono zamówienia. Możesz nadal edytować formularz i ponawiać test.',
      'success'
    );
    button.disabled = false;
    button.textContent = 'Sprawdź wysłanie — tryb demo';
    return;
  }

  if (!invitationValidated || !securityReady || !turnstileToken || !orderConfig) {
    showStatus(
      'Poczekaj na zakończenie weryfikacji i pobranie aktualnych warunków zamówienia.',
      'error'
    );
    return;
  }

  const attachmentFiles = Array.from(attachmentInput?.files || []);
  const attachmentError = validateAttachmentFiles(attachmentFiles);
  if (attachmentError) {
    if (attachmentStatus) attachmentStatus.textContent = attachmentError;
    showStatus(attachmentError, 'error');
    return;
  }

  const values = Object.fromEntries(new FormData(form).entries());
  values.privacy = Boolean(values.privacy);
  values.special_category_consent = Boolean(values.special_category_consent);
  values.terms_and_privacy_accepted = values.privacy;
  values.early_start_requested = values.privacy;
  values.order_obligation_to_pay = true;
  values.order_schema_version = orderConfig.schema_version;
  values.order_service_code = orderConfig.service_code;
  values.regulation_version = orderConfig.regulation_version;
  values.privacy_version = orderConfig.privacy_version;
  values.contract_statement_version = orderConfig.contract_statement_version;
  values.submission_request_id = getActiveRequestId();
  values.invitation_token = INVITATION_TOKEN;
  values.turnstile_token = turnstileToken;

  button.disabled = true;
  button.textContent = 'Składanie zamówienia…';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  let submittedSuccessfully = false;

  try {
    const response = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
      signal: controller.signal
    });

    let payload = {};
    try {
      payload = await response.json();
    } catch {
      // A generic message is shown below if JSON is unavailable.
    }

    if (!response.ok) {
      throw new Error(
        payload.error ||
        `Nie udało się zapisać ankiety (HTTP ${response.status}).`
      );
    }

    submittedSuccessfully = true;
    showInvitationGate(
      'Dziękujemy za wysłanie ankiety',
      attachmentFiles.length
        ? 'Przekazujemy teraz dodane dokumenty do Twojej sprawy.'
        : 'Ankieta została wysłana. Potwierdzenie otrzymasz e-mailem.',
      'success'
    );
    const reference = payload.reference
      ? ` Numer zgłoszenia: ${payload.reference}.`
      : '';
    const duplicateInfo = payload.duplicate
      ? ' To zgłoszenie było już zapisane — nie utworzono duplikatu.'
      : '';
    const emailInfo = payload.confirmation_email_status === 'sent'
      ? ' Potwierdzenie wysłaliśmy na podany adres e-mail.'
      : ' Potwierdzenie e-mail zostało przekazane do wysyłki.';

    savedSubmissionMessage =
      `Ankieta została wysłana. Dziękujemy — nie musisz już nic robić. Skontaktujemy się z Tobą po jej weryfikacji.${reference}${duplicateInfo}${emailInfo} Po weryfikacji kompletności otrzymasz informację o przyjęciu zamówienia i dane do płatności.`;

    if (attachmentFiles.length) {
      if (!payload.id) {
        lockSubmittedForm();
        button.textContent = 'Ankieta wysłana';
        clearActiveRequestId();
        window.history.replaceState({}, document.title, window.location.pathname);
        if (attachmentStatus) {
          attachmentStatus.textContent = 'Ankieta została zapisana. Nie możemy potwierdzić wysyłki dokumentów.';
        }
        showStatus(
          'Ankieta została zapisana, ale nie możemy dołączyć dokumentów. Nie musisz wypełniać ankiety ponownie — skontaktuj się z nami pod adresem kontakt@pogotowieupadlosciowe.pl.',
          'error'
        );
        return;
      }
      pendingAttachmentUpload = {
        submissionId: payload.id,
        files: attachmentFiles,
        uploadedIndexes: new Set(),
        uploadIds: Array(attachmentFiles.length).fill('')
      };
      lockSubmittedForm();
      button.textContent = 'Wysyłamy dokumenty…';
      try {
        await uploadPendingAttachments();
        finalizeSavedSubmission();
      } catch {
        button.textContent = 'Ankieta wysłana';
        if (attachmentStatus) {
          attachmentStatus.textContent = 'Nie udało się przesłać wszystkich dokumentów. Ankieta została zapisana.';
        }
        showStatus(
          'Ankieta została zapisana, ale nie udało się przesłać wszystkich dokumentów. Nie musisz wypełniać ankiety ponownie — skontaktuj się z nami pod adresem kontakt@pogotowieupadlosciowe.pl.',
          'error'
        );
      }
      return;
    }

    finalizeSavedSubmission();
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'Przekroczono czas oczekiwania. Zgłoszenie mogło zostać zapisane. Sprawdź skrzynkę e-mail; ponowne wysłanie z tej karty użyje tego samego identyfikatora i nie powinno utworzyć duplikatu.'
      : error.message;

    showStatus(message, 'error');
  } finally {
    clearTimeout(timeout);
    if (!submittedSuccessfully) {
      resetTurnstile();
    }
  }
});

specialCategoryChoices.forEach((choice) => {
  choice.addEventListener('change', syncSpecialCategoryConsent);
});
syncSpecialCategoryConsent();
initializeSecurity();
