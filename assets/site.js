const QUICK_CHECK_API_BASE = 'https://pogotowieupadlosciowe-api-v2.pogotowieupadlosciowe.workers.dev';
// Wklej tutaj link skopiowany ze strony rezerwacji Google Calendar.
const QUICK_CHECK_BOOKING_URL = 'https://calendar.app.google/JZmnARJDQP8PH6B28';
const QUICK_CHECK_TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const menuButton = document.querySelector('[data-menu-toggle]');
const menu = document.getElementById('main-menu');

function closeMenu() {
  if (!menuButton || !menu) return;
  menu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  });
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

function loadQuickCheckTurnstileScript() {
  if (window.turnstile) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = QUICK_CHECK_TURNSTILE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Nie udało się załadować zabezpieczenia formularza.'));
    document.head.appendChild(script);
  });
}

function initializeQuickCheck(root) {
  const quizForm = root.querySelector('[data-quick-form]');
  const steps = [...root.querySelectorAll('[data-quick-step]')];
  const nextButton = root.querySelector('[data-quick-next]');
  const backButton = root.querySelector('[data-quick-back]');
  const nextLabel = root.querySelector('[data-quick-next-label]');
  const progressText = root.querySelector('[data-quick-progress-text]');
  const progressBar = root.querySelector('[data-quick-progress-bar]');
  const results = [...root.querySelectorAll('[data-quick-result]')];
  const resetButtons = [...root.querySelectorAll('[data-quick-reset]')];
  const consultationButtons = [...root.querySelectorAll('[data-consultation-choice]')];
  const consultationPanels = [...root.querySelectorAll('[data-consultation-panel]')];
  const bookingLink = root.querySelector('[data-booking-link]');
  const bookingNote = root.querySelector('[data-booking-note]');
  const contactForm = root.querySelector('[data-quick-contact-form]');
  const contactSubmit = root.querySelector('[data-quick-contact-submit]');
  const turnstileBox = root.querySelector('[data-quick-turnstile]');
  const securityStatus = root.querySelector('[data-quick-security-status]');
  const submitStatus = root.querySelector('[data-quick-submit-status]');

  if (!quizForm || !steps.length || !nextButton || !backButton) return;

  let currentStep = 0;
  let turnstileWidgetId = null;
  let turnstileToken = '';
  let securityInitialized = false;

  const answerNames = ['business', 'payments', 'delay'];

  function selectedAnswer(index) {
    return quizForm.querySelector(`input[name="${answerNames[index]}"]:checked`);
  }

  function updateStep() {
    steps.forEach((step, index) => {
      step.hidden = index !== currentStep;
    });
    results.forEach((result) => { result.hidden = true; });
    quizForm.hidden = false;
    progressText.textContent = `Pytanie ${currentStep + 1} z ${steps.length}`;
    progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
    backButton.hidden = currentStep === 0;
    nextButton.disabled = !selectedAnswer(currentStep);
    if (nextLabel) nextLabel.textContent = currentStep === steps.length - 1 ? 'Sprawdź wynik' : 'Dalej';
  }

  function showResult(type) {
    quizForm.hidden = true;
    results.forEach((result) => {
      result.hidden = result.dataset.quickResult !== type;
    });
    progressText.textContent = 'Wynik szybkiej oceny';
    progressBar.style.width = '100%';
  }

  function resetQuiz() {
    quizForm.reset();
    currentStep = 0;
    consultationButtons.forEach((button) => button.setAttribute('aria-pressed', 'false'));
    consultationPanels.forEach((panel) => { panel.hidden = true; });
    if (contactForm) contactForm.reset();
    if (submitStatus) {
      submitStatus.textContent = '';
      submitStatus.className = 'home-quick-submit-status';
    }
    updateStep();
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  quizForm.addEventListener('change', () => {
    nextButton.disabled = !selectedAnswer(currentStep);
  });

  nextButton.addEventListener('click', () => {
    if (!selectedAnswer(currentStep)) return;
    if (currentStep < steps.length - 1) {
      currentStep += 1;
      updateStep();
      steps[currentStep].querySelector('input')?.focus();
      return;
    }

    const answers = answerNames.map((name) => quizForm.querySelector(`input[name="${name}"]:checked`)?.value);
    showResult(answers.every((answer) => answer === 'B') ? 'positive' : 'review');
  });

  backButton.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep -= 1;
      updateStep();
    }
  });

  resetButtons.forEach((button) => button.addEventListener('click', resetQuiz));

  if (bookingLink) {
    if (QUICK_CHECK_BOOKING_URL) {
      bookingLink.href = QUICK_CHECK_BOOKING_URL;
      bookingLink.target = '_blank';
      bookingLink.rel = 'noopener';
      bookingLink.removeAttribute('aria-disabled');
      if (bookingNote) bookingNote.textContent = 'Kalendarz otworzy się w nowej karcie.';
    } else {
      bookingLink.addEventListener('click', (event) => event.preventDefault());
    }
  }

  function setSecurityStatus(message, type = '') {
    if (!securityStatus) return;
    securityStatus.textContent = message;
    securityStatus.className = `home-quick-security-status${type ? ` is-${type}` : ''}`;
  }

  function setSubmitStatus(message, type = '') {
    if (!submitStatus) return;
    submitStatus.textContent = message;
    submitStatus.className = `home-quick-submit-status${type ? ` is-${type}` : ''}`;
  }

  function setContactReady(ready) {
    if (contactSubmit) contactSubmit.disabled = !ready;
  }

  async function initializePhoneSecurity() {
    if (securityInitialized || !turnstileBox) return;
    securityInitialized = true;
    setContactReady(false);
    setSecurityStatus('Ładowanie weryfikacji bezpieczeństwa…');

    try {
      const response = await fetch(`${QUICK_CHECK_API_BASE}/public-config`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer'
      });
      const config = await response.json();
      if (!response.ok) throw new Error(config.error || 'Nie udało się pobrać konfiguracji formularza.');
      if (!config.form_enabled) throw new Error('Formularz kontaktowy jest obecnie wyłączony.');
      if (!config.turnstile_enabled || !config.turnstile_site_key) throw new Error('Weryfikacja bezpieczeństwa nie została skonfigurowana.');

      await loadQuickCheckTurnstileScript();
      turnstileWidgetId = window.turnstile.render(turnstileBox, {
        sitekey: config.turnstile_site_key,
        theme: 'dark',
        size: 'normal',
        action: 'submit_ankieta',
        callback(token) {
          turnstileToken = token;
          setContactReady(true);
          setSecurityStatus('Weryfikacja bezpieczeństwa zakończona.', 'success');
        },
        'expired-callback'() {
          turnstileToken = '';
          setContactReady(false);
          setSecurityStatus('Weryfikacja wygasła. Zaznacz ją ponownie.');
        },
        'error-callback'() {
          turnstileToken = '';
          setContactReady(false);
          setSecurityStatus('Nie udało się przeprowadzić weryfikacji.', 'error');
        }
      });
    } catch (error) {
      setContactReady(false);
      setSecurityStatus(error.message, 'error');
    }
  }

  consultationButtons.forEach((button) => {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      const type = button.dataset.consultationChoice;
      consultationButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      consultationPanels.forEach((panel) => {
        panel.hidden = panel.dataset.consultationPanel !== type;
      });
      if (type === 'phone') initializePhoneSecurity();
    });
  });

  if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setSubmitStatus('');
      if (!contactForm.reportValidity()) return;
      if (!turnstileToken) {
        setSubmitStatus('Poczekaj na zakończenie weryfikacji bezpieczeństwa.', 'error');
        return;
      }

      const formData = new FormData(contactForm);
      const answers = {
        business: quizForm.querySelector('input[name="business"]:checked')?.value || '',
        payments: quizForm.querySelector('input[name="payments"]:checked')?.value || '',
        delay: quizForm.querySelector('input[name="delay"]:checked')?.value || ''
      };
      const summary = [
        'Źródło: szybka ocena na stronie głównej.',
        `Działalność gospodarcza: ${answers.business === 'B' ? 'NIE' : 'TAK'}.`,
        `Bieżąca zdolność regulowania zobowiązań: ${answers.payments === 'B' ? 'NIE' : 'TAK'}.`,
        `Opóźnienie: ${answers.delay === 'B' ? 'POWYŻEJ 3 MIESIĘCY' : 'PONIŻEJ 3 MIESIĘCY'}.`,
        'Preferowany kontakt: konsultacja telefoniczna.'
      ].join(' ');

      const payload = {
        full_name: String(formData.get('full_name') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        privacy: formData.get('privacy') === 'on',
        insolvency_story: summary,
        turnstile_token: turnstileToken
      };

      contactSubmit.disabled = true;
      contactSubmit.textContent = 'Wysyłanie…';

      try {
        const response = await fetch(`${QUICK_CHECK_API_BASE}/submissions`, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Nie udało się wysłać prośby o kontakt (HTTP ${response.status}).`);

        const reference = data.reference ? ` Numer zgłoszenia: ${data.reference}.` : '';
        setSubmitStatus(`Dziękujemy. Prośba o kontakt została zapisana.${reference}`, 'success');
        contactForm.reset();
      } catch (error) {
        setSubmitStatus(error.message, 'error');
      } finally {
        contactSubmit.textContent = 'Poproś o kontakt';
        turnstileToken = '';
        setContactReady(false);
        if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
      }
    });
  }

  updateStep();
}

document.querySelectorAll('[data-quick-check]').forEach(initializeQuickCheck);
