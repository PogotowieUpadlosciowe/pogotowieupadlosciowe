const API_BASE = 'https://pogotowieupadlosciowe-api-v2.pogotowieupadlosciowe.workers.dev';
const form = document.getElementById('ankieta-form');
const button = document.getElementById('submit-button');
const statusBox = document.getElementById('form-status');

function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `form-status ${type}`;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusBox.className = 'form-status';

  if (!form.reportValidity()) return;

  const values = Object.fromEntries(new FormData(form).entries());
  if (values.website) return;
  delete values.website;
  values.privacy = Boolean(values.privacy);

  button.disabled = true;
  button.textContent = 'Wysyłanie…';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

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
      throw new Error(payload.error || `Nie udało się zapisać ankiety (HTTP ${response.status}).`);
    }

    form.reset();
    const reference = payload.reference ? ` Numer zgłoszenia: ${payload.reference}.` : '';
    const emailInfo = payload.confirmation_email_sent
      ? ' Potwierdzenie wysłaliśmy na podany adres e-mail.'
      : ' Zgłoszenie zostało zapisane, ale nie udało się wysłać potwierdzenia e-mail.';
    showStatus(`Dziękujemy. Ankieta została zapisana.${reference}${emailInfo}`, 'success');
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'Przekroczono czas oczekiwania. Sprawdź panel przed ponownym wysłaniem, aby nie utworzyć duplikatu.'
      : error.message;
    showStatus(message, 'error');
  } finally {
    clearTimeout(timeout);
    button.disabled = false;
    button.textContent = 'Wyślij ankietę';
  }
});
