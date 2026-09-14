const API_BASE = 'https://pogotowieupadlosciowe-api-v2.pogotowieupadlosciowe.workers.dev';
const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const REQUEST_ID_STORAGE_KEY = 'pu-active-submission-request-id-v1';
const INVITATION_TOKEN = new URLSearchParams(window.location.search).get('token') || '';
const PREVIEW_HOST_SUFFIXES = Object.freeze(['.pages.dev', '.chatgpt.site']);
const DEMO_MODE =
  ['localhost', '127.0.0.1'].includes(window.location.hostname) ||
  PREVIEW_HOST_SUFFIXES.some((suffix) => window.location.hostname.endsWith(suffix));

const FALLBACK_ORDER_CONFIG = Object.freeze({
  schema_version: 1,
  service_code: 'consumer-bankruptcy-application-project',
  service_name: 'Przygotowanie projektu wniosku o ogłoszenie upadłości konsumenckiej',
  price_gross_minor: 200000,
  currency: 'PLN',
  price_display: '2 000 zł',
  fulfillment_text: 'Do 3 dni roboczych od otrzymania kompletu wymaganych informacji i dokumentów oraz zaksięgowania płatności',
  revisions_text: 'Bezpłatne poprawki przy weryfikacji projektu wniosku',
  scope_note: 'Usługa nie obejmuje porad prawnych ani reprezentacji. Dane do płatności zostaną przekazane e-mailem po potwierdzeniu przyjęcia zamówienia.',
  regulation_version: 'REG-2026-07-04-01',
  privacy_version: 'PP-2026-07-04-01',
  contract_statement_version: 'OSW-2026-07-04-01'
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
        ? 'Zgłoszenie mogło już zostać zapisane. Możesz ponowić wysłanie — system nie utworzy duplikatu.'
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
    clearActiveRequestId();
    form.reset();
    Array.from(form.elements).forEach((element) => { element.disabled = true; });
    button.textContent = 'Zamówienie złożone';
    showInvitationGate(
      'Link został wykorzystany',
      'Ankieta i zamówienie zostały zapisane. Ten link nie pozwoli na utworzenie kolejnego zgłoszenia.',
      'success'
    );
    window.history.replaceState({}, document.title, window.location.pathname);

    const reference = payload.reference
      ? ` Numer zgłoszenia: ${payload.reference}.`
      : '';
    const duplicateInfo = payload.duplicate
      ? ' To zgłoszenie było już zapisane — nie utworzono duplikatu.'
      : '';
    const emailInfo = payload.confirmation_email_status === 'sent'
      ? ' Potwierdzenie wysłaliśmy na podany adres e-mail.'
      : ' Potwierdzenie e-mail zostało przekazane do wysyłki.';

    showStatus(
      `Ankieta została wysłana. Dziękujemy — skontaktujemy się z Tobą po jej weryfikacji.${reference}${duplicateInfo}${emailInfo} Po weryfikacji kompletności otrzymasz informację o przyjęciu zamówienia i dane do płatności.`,
      'success'
    );
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
