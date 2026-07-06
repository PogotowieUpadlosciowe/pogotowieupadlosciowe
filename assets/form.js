const API_BASE = 'https://pogotowieupadlosciowe-api-v2.pogotowieupadlosciowe.workers.dev';
const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const REQUEST_ID_STORAGE_KEY = 'pu-active-submission-request-id-v1';

const FALLBACK_ORDER_CONFIG = Object.freeze({
  schema_version: 1,
  service_code: 'consumer-bankruptcy-application-project',
  service_name: 'Przygotowanie projektu wniosku',
  price_gross_minor: 200000,
  currency: 'PLN',
  price_display: '2000 zł',
  fulfillment_text: 'Do 3 dni roboczych od płatności i otrzymania kompletu materiałów',
  revisions_text: 'Jedna runda poprawek w cenie',
  scope_note: 'Usługa nie obejmuje porad prawnych ani reprezentacji. Dane do przelewu zostaną przekazane e-mailem po potwierdzeniu przyjęcia zamówienia.',
  regulation_version: 'REG-2026-07-04-01',
  privacy_version: 'PP-2026-07-04-01',
  contract_statement_version: 'OSW-2026-07-04-01'
});

const form = document.getElementById('ankieta-form');
const button = document.getElementById('submit-button');
const statusBox = document.getElementById('form-status');
const turnstileBox = document.getElementById('turnstile-widget');
const turnstileStatus = document.getElementById('turnstile-status');

let turnstileWidgetId = null;
let turnstileToken = '';
let securityReady = false;
let orderConfig = null;
let memoryRequestId = '';

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
    ? 'Zamawiam z obowiązkiem zapłaty'
    : 'Ładowanie zabezpieczenia…';
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element && value) element.textContent = value;
}

function applyOrderConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Brakuje konfiguracji zamówienia. Odśwież stronę i spróbuj ponownie.');
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
    throw new Error('Konfiguracja zamówienia jest niepełna. Odśwież stronę i spróbuj ponownie.');
  }

  orderConfig = Object.freeze({ ...config });
  setText('order-service-name', config.service_name);
  setText('order-price-display', config.price_display);
  setText('order-fulfillment-text', config.fulfillment_text);
  setText('order-revisions-text', config.revisions_text);
  setText('order-scope-note', config.scope_note);
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
      new Error('Nie udało się załadować zabezpieczenia Turnstile.')
    );
    document.head.appendChild(script);
  });
}

function resetTurnstile(message = 'Weryfikacja jest odnawiana…') {
  turnstileToken = '';
  setButtonReady(false);
  showTurnstileStatus(message);

  if (window.turnstile && turnstileWidgetId !== null) {
    window.turnstile.reset(turnstileWidgetId);
  }
}

async function initializeSecurity() {
  setButtonReady(false);
  showTurnstileStatus('Ładowanie weryfikacji bezpieczeństwa…');

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
        showTurnstileStatus('Weryfikacja bezpieczeństwa zakończona.', 'success');
      },
      'expired-callback'() {
        resetTurnstile('Weryfikacja wygasła. Trwa generowanie nowej.');
      },
      'timeout-callback'() {
        resetTurnstile('Weryfikacja przekroczyła czas. Trwa ponowna próba.');
      },
      'error-callback'() {
        turnstileToken = '';
        setButtonReady(false);
        showTurnstileStatus(
          'Nie udało się przeprowadzić weryfikacji. Odśwież stronę albo spróbuj ponownie później.',
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

  if (!securityReady || !turnstileToken || !orderConfig) {
    showStatus(
      'Poczekaj na zakończenie weryfikacji i pobranie aktualnych warunków zamówienia.',
      'error'
    );
    return;
  }

  const values = Object.fromEntries(new FormData(form).entries());
  values.privacy = Boolean(values.privacy);
  values.terms_and_privacy_accepted = values.privacy;
  values.early_start_requested = values.privacy;
  values.order_obligation_to_pay = true;
  values.order_schema_version = orderConfig.schema_version;
  values.order_service_code = orderConfig.service_code;
  values.regulation_version = orderConfig.regulation_version;
  values.privacy_version = orderConfig.privacy_version;
  values.contract_statement_version = orderConfig.contract_statement_version;
  values.submission_request_id = getActiveRequestId();
  values.turnstile_token = turnstileToken;

  button.disabled = true;
  button.textContent = 'Składanie zamówienia…';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

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

    clearActiveRequestId();
    form.reset();

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
      `Dziękujemy. Ankieta i zamówienie zostały zapisane.${reference}${duplicateInfo}${emailInfo} Po weryfikacji kompletności otrzymasz informację o przyjęciu zamówienia i dane do przelewu.`,
      'success'
    );
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'Przekroczono czas oczekiwania. Zgłoszenie mogło zostać zapisane. Sprawdź skrzynkę e-mail; ponowne wysłanie z tej karty użyje tego samego identyfikatora i nie powinno utworzyć duplikatu.'
      : error.message;

    showStatus(message, 'error');
  } finally {
    clearTimeout(timeout);
    resetTurnstile('Przygotowywanie nowej weryfikacji…');
  }
});

initializeSecurity();
