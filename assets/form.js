const API_BASE = 'https://pogotowieupadlosciowe-api-v2.pogotowieupadlosciowe.workers.dev';
const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const REGULATION_VERSION = 'REG-2026-07-04-01';
const PRIVACY_VERSION = 'PP-2026-07-04-01';
const ORDER_SERVICE = 'Przygotowanie projektu wniosku';
const ORDER_PRICE_PLN = '2000';

const form = document.getElementById('ankieta-form');
const button = document.getElementById('submit-button');
const statusBox = document.getElementById('form-status');
const turnstileBox = document.getElementById('turnstile-widget');
const turnstileStatus = document.getElementById('turnstile-status');

let turnstileWidgetId = null;
let turnstileToken = '';
let securityReady = false;

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

function loadTurnstileScript() {
  if (window.turnstile) {
    return Promise.resolve();
  }

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

  if (
    window.turnstile &&
    turnstileWidgetId !== null
  ) {
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

  if (!securityReady || !turnstileToken) {
    showStatus(
      'Poczekaj na zakończenie weryfikacji bezpieczeństwa.',
      'error'
    );
    return;
  }

  const values = Object.fromEntries(new FormData(form).entries());
  values.privacy = Boolean(values.privacy);
  values.terms_and_privacy_accepted = values.privacy;
  values.early_start_requested = values.privacy;
  values.order_obligation_to_pay = values.privacy;
  values.regulation_version = REGULATION_VERSION;
  values.privacy_version = PRIVACY_VERSION;
  values.order_service = ORDER_SERVICE;
  values.order_price_pln = ORDER_PRICE_PLN;
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
      // Response without JSON; a generic message is shown below.
    }

    if (!response.ok) {
      throw new Error(
        payload.error ||
        `Nie udało się zapisać ankiety (HTTP ${response.status}).`
      );
    }

    form.reset();
    const reference = payload.reference
      ? ` Numer zgłoszenia: ${payload.reference}.`
      : '';
    const emailInfo = payload.confirmation_email_sent
      ? ' Potwierdzenie wysłaliśmy na podany adres e-mail.'
      : ' Zgłoszenie zostało zapisane, ale nie udało się wysłać potwierdzenia e-mail.';

    showStatus(
      `Dziękujemy. Ankieta i zamówienie zostały zapisane.${reference}${emailInfo} Po weryfikacji kompletności otrzymasz e-mailem potwierdzenie przyjęcia zamówienia i dane do przelewu.`,
      'success'
    );
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'Przekroczono czas oczekiwania. Sprawdź panel przed ponownym wysłaniem, aby nie utworzyć duplikatu.'
      : error.message;

    showStatus(message, 'error');
  } finally {
    clearTimeout(timeout);
    resetTurnstile('Przygotowywanie nowej weryfikacji…');
  }
});

initializeSecurity();
