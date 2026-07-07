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
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMenu(); });
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

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
  if (!quizForm || !steps.length || !nextButton || !backButton) return;

  let currentStep = 0;
  const answerNames = ['business', 'payments', 'delay'];
  const selectedAnswer = (index) => quizForm.querySelector(`input[name="${answerNames[index]}"]:checked`);

  function updateStep() {
    steps.forEach((step, index) => { step.hidden = index !== currentStep; });
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
    results.forEach((result) => { result.hidden = result.dataset.quickResult !== type; });
    progressText.textContent = 'Podsumowanie odpowiedzi';
    progressBar.style.width = '100%';
  }

  function resetQuiz() {
    quizForm.reset();
    currentStep = 0;
    updateStep();
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  quizForm.addEventListener('change', () => { nextButton.disabled = !selectedAnswer(currentStep); });
  nextButton.addEventListener('click', () => {
    if (!selectedAnswer(currentStep)) return;
    if (currentStep < steps.length - 1) {
      currentStep += 1;
      updateStep();
      steps[currentStep].querySelector('input')?.focus();
      return;
    }
    const answers = Object.fromEntries(answerNames.map((name) => [name, quizForm.querySelector(`input[name="${name}"]:checked`)?.value]));
    let resultType;
    if (answers.business === 'A') {
      resultType = 'business';
    } else if (answers.payments === 'A') {
      resultType = 'current';
    } else if (answers.delay === 'A') {
      resultType = 'early';
    } else {
      resultType = 'positive';
    }
    showResult(resultType);
  });
  backButton.addEventListener('click', () => { if (currentStep > 0) { currentStep -= 1; updateStep(); } });
  resetButtons.forEach((button) => button.addEventListener('click', resetQuiz));
  updateStep();
}

document.querySelectorAll('[data-quick-check]').forEach(initializeQuickCheck);

function initializeBookingPanel(panel) {
  const frame = panel.querySelector('[data-booking-frame]');
  const heading = panel.querySelector('#booking-title');
  const closeButton = panel.querySelector('[data-booking-close]');
  const openButtons = [...document.querySelectorAll('[data-booking-open]')];
  let loaded = false;

  function loadFrame() {
    if (loaded || !frame) return;
    const source = frame.dataset.src;
    if (!source) return;
    frame.src = source;
    loaded = true;
  }

  function openPanel({ scroll = true } = {}) {
    panel.hidden = false;
    panel.classList.add('is-open');
    openButtons.forEach((button) => button.setAttribute('aria-expanded', 'true'));
    loadFrame();
    if (scroll) {
      window.requestAnimationFrame(() => {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => heading?.focus({ preventScroll: true }), 350);
      });
    }
  }

  function closePanel() {
    panel.hidden = true;
    panel.classList.remove('is-open');
    openButtons.forEach((button) => button.setAttribute('aria-expanded', 'false'));
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('rezerwacja');
      url.hash = '';
      const cleanUrl = `${url.pathname}${url.search}` || 'kontakt.html';
      window.history.replaceState({}, '', cleanUrl);
    } catch {
      // Brak operacji — np. w statycznym podglądzie bez poprawnego originu.
    }
    openButtons[0]?.focus();
  }

  openButtons.forEach((button) => button.addEventListener('click', () => openPanel()));
  closeButton?.addEventListener('click', closePanel);

  const params = new URLSearchParams(window.location.search);
  if (params.get('rezerwacja') === '1') {
    openPanel({ scroll: true });
  }
}

document.querySelectorAll('[data-booking-panel]').forEach(initializeBookingPanel);
