const siteAssetBaseUrl = document.currentScript?.src
  ? new URL('.', document.currentScript.src)
  : new URL('assets/', window.location.href);

function initializeApprovedBrandLogo() {
  const headerLogoSrc = new URL('../images/logo/logo-horizontal-light.svg?v=20260822-05', siteAssetBaseUrl).href;
  const footerLogoSrc = new URL('../images/logo/logo-horizontal-dark.svg?v=20260822-05', siteAssetBaseUrl).href;

  document.querySelectorAll('.brand img').forEach((image) => {
    image.src = headerLogoSrc;
    image.alt = 'Pogotowie Upadłościowe';
    image.removeAttribute('width');
    image.removeAttribute('height');
  });

  document.querySelectorAll('.footer-brand img').forEach((image) => {
    image.src = footerLogoSrc;
    image.alt = 'Pogotowie Upadłościowe';
    image.removeAttribute('width');
    image.removeAttribute('height');
    image.removeAttribute('style');
  });
}

initializeApprovedBrandLogo();

function initializeUnifiedTopbar() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;

  if (!document.querySelector('link[data-unified-topbar]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('topbar-unified.css?v=20260822-05', siteAssetBaseUrl).href;
    stylesheet.dataset.unifiedTopbar = '';
    document.head.appendChild(stylesheet);
  }

  topbar.innerHTML = `
    <div class="container topbar-inner">
      <a class="topbar-phone" href="tel:+48574650730">
        <svg aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.28-1.28a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92Z"></path>
        </svg>
        574 650 730
      </a>
      <div class="topbar-note">
        <svg aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>
          <path d="m9 12 2 2 4-4"></path>
        </svg>
        <span>Profesjonalne przygotowanie Twojego wniosku o ogłoszenie upadłości konsumenckiej — 100% zdalnie</span>
      </div>
      <a class="topbar-email" href="mailto:kontakt@pogotowieupadlosciowe.pl">
        <svg aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="2"></rect>
          <path d="m3 7 9 6 9-6"></path>
        </svg>
        kontakt@pogotowieupadlosciowe.pl
      </a>
    </div>`;
}

initializeUnifiedTopbar();

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
  const calRoot = panel.querySelector('[data-cal-inline]');
  const heading = panel.querySelector('#booking-title');
  const closeButton = panel.querySelector('[data-booking-close]');
  const openButtons = [...document.querySelectorAll('[data-booking-open]')];
  let loaded = false;
  let returnFocus = null;

  function loadBookingCalendar() {
    if (loaded || !calRoot) return;
    const calLink = calRoot.dataset.calLink;
    if (!calLink) return;

    (function initializeCalLoader(global, scriptSource, initCommand) {
      const enqueue = (api, args) => api.q.push(args);
      const documentRef = global.document;
      global.Cal = global.Cal || function calQueue() {
        const cal = global.Cal;
        const args = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          const script = documentRef.createElement('script');
          script.src = scriptSource;
          script.async = true;
          documentRef.head.appendChild(script);
          cal.loaded = true;
        }
        if (args[0] === initCommand) {
          const namespace = args[1];
          const api = function calNamespaceQueue() { enqueue(api, arguments); };
          api.q = api.q || [];
          if (typeof namespace === 'string') {
            cal.ns[namespace] = cal.ns[namespace] || api;
            enqueue(cal.ns[namespace], args);
            enqueue(cal, ['initNamespace', namespace]);
          } else {
            enqueue(cal, args);
          }
          return;
        }
        enqueue(cal, args);
      };
    }(window, 'https://app.cal.com/embed/embed.js', 'init'));

    window.Cal('init', 'wideorozmowa', { origin: 'https://app.cal.com' });
    window.Cal.ns.wideorozmowa('inline', {
      elementOrSelector: '#cal-inline-wideorozmowa',
      config: { layout: 'month_view', timeFormat: '24', theme: 'light' },
      calLink,
    });
    window.Cal.ns.wideorozmowa('ui', {
      hideEventTypeDetails: false,
      layout: 'month_view',
      theme: 'light',
      cssVarsPerTheme: {
        light: {
          'cal-brand': '#126fdf',
          'cal-brand-emphasis': '#0b58b5',
          'cal-brand-text': '#ffffff',
          'cal-brand-subtle': '#cfe5ff',
          'cal-brand-accent': '#ffffff',
          'cal-text': '#334e70',
          'cal-text-emphasis': '#06172f',
          'cal-text-subtle': '#60738d',
          'cal-text-muted': '#9aa9bb',
          'cal-text-inverted': '#ffffff',
          'cal-bg': '#ffffff',
          'cal-bg-emphasis': '#e5f1ff',
          'cal-bg-subtle': '#f1f7ff',
          'cal-bg-muted': '#f8fbff',
          'cal-bg-inverted': '#06172f',
          'cal-border': '#dce5ef',
          'cal-border-emphasis': '#126fdf',
          'cal-border-subtle': '#dce5ef',
          'cal-border-muted': '#edf2f7',
          'cal-border-booker': '#dce5ef',
          'cal-border-booker-width': '1px',
          radius: '0.5rem',
          'radius-md': '0.625rem',
          'radius-lg': '0.75rem',
          'radius-xl': '0.875rem',
          'radius-2xl': '1rem',
          'radius-3xl': '1.5rem',
          'radius-full': '9999px',
        },
      },
    });
    loaded = true;
  }

  function openPanel() {
    if (panel.open) return;
    returnFocus = document.activeElement;
    if (typeof panel.showModal === 'function') {
      panel.showModal();
    } else {
      panel.setAttribute('open', '');
    }
    panel.classList.add('is-open');
    document.documentElement.classList.add('booking-dialog-open');
    openButtons.forEach((button) => button.setAttribute('aria-expanded', 'true'));
    loadBookingCalendar();
    window.requestAnimationFrame(() => heading?.focus({ preventScroll: true }));
  }

  function closePanel() {
    if (typeof panel.close === 'function' && panel.open) {
      panel.close();
    } else {
      panel.removeAttribute('open');
    }
    panel.classList.remove('is-open');
    document.documentElement.classList.remove('booking-dialog-open');
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
    const focusTarget = returnFocus instanceof HTMLElement ? returnFocus : openButtons[0];
    focusTarget?.focus();
  }

  openButtons.forEach((button) => button.addEventListener('click', () => openPanel()));
  closeButton?.addEventListener('click', closePanel);
  panel.addEventListener('cancel', (event) => {
    event.preventDefault();
    closePanel();
  });
  panel.addEventListener('click', (event) => {
    if (event.target === panel) closePanel();
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('rezerwacja') === '1') {
    openPanel();
  }
}

document.querySelectorAll('[data-booking-panel]').forEach(initializeBookingPanel);
