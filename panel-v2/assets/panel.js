(() => {
  "use strict";

  const STATUS_LABELS = {
    new: "Nowa",
    contacted: "Po kontakcie",
    analysis: "Analiza",
    waiting_documents: "Oczekuje na dokumenty",
    in_progress: "W realizacji",
    completed: "Zakończona",
    rejected: "Odrzucona"
  };

  const PAYMENT_LABELS = {
    not_set: "Nie ustalono",
    awaiting: "Oczekuje na przelew",
    paid: "Opłacone",
    refunded: "Zwrócono"
  };

  const MATERIAL_LABELS = {
    not_verified: "Niezweryfikowane",
    incomplete: "Niekompletne",
    complete: "Kompletne"
  };

  const CHECK_LABELS = {
    missing: "Brakuje",
    received: "Otrzymano",
    not_applicable: "Nie dotyczy"
  };

  const CASE_TABS = [
    ["overview", "Przebieg"],
    ["questionnaire", "Ankieta"],
    ["creditors", "Wierzyciele"],
    ["documents", "Dokumenty"],
    ["order", "Zamówienie"],
    ["history", "Historia"]
  ];

  const ADMIN_ROUTES = new Set(["retention", "backups", "audit", "users", "settings"]);

  const fixtures = {
    cases: [
      {
        id: "DEMO-2026-001",
        ref: "PU-DEMO-A71C93",
        name: "Anna Przykładowa",
        initials: "AP",
        email: "anna.przykladowa@example.com",
        phone: "+48 600 100 201",
        city: "Wrocław",
        createdAt: "22 wrz 2026, 09:42",
        updatedAt: "dzisiaj, 08:15",
        status: "waiting_documents",
        payment: "paid",
        materials: "incomplete",
        stage: 3,
        owner: "Ania Kowalska",
        amount: 2000,
        term: "6 paź 2026, 18:00",
        nextAction: "Poproś o brakujące zestawienia zadłużenia",
        nextActionDue: "Dzisiaj do 12:00",
        attention: "Brakuje 2 dokumentów",
        priority: "high",
        pesel: "DEMO-PESEL-001",
        idNumber: "DOWOD-DEMO-001",
        address: "Fikcyjny adres demonstracyjny 1, Wrocław",
        questionnaire: {
          maritalStatus: "Rozwiedziona",
          household: "2 osoby",
          employment: "Umowa o pracę",
          income: "5 200,00 zł netto",
          expenses: "4 100,00 zł miesięcznie",
          assets: "Samochód osobowy, rok 2012",
          health: "Pole demonstracyjne: odrębna zgoda zaznaczona",
          realEstate: "Brak",
          arrearsSince: "sierpień 2023",
          business: "Działalność zamknięta w 2021 r."
        },
        creditors: [
          { name: "Bank Przykładowy S.A.", kind: "Kredyt gotówkowy", amount: 48500, disputed: false },
          { name: "Demo Finance sp. z o.o.", kind: "Pożyczka", amount: 17200, disputed: false },
          { name: "Gmina Testowa", kind: "Zaległość administracyjna", amount: 3200, disputed: true }
        ],
        documents: [
          { id: "d1", name: "Raport BIK", state: "received", note: "Otrzymano 22 września" },
          { id: "d2", name: "Umowy kredytowe i pożyczkowe", state: "missing", note: "Brakuje 2 umów" },
          { id: "d3", name: "Wyciągi bankowe za 6 miesięcy", state: "received", note: "6 plików PDF" },
          { id: "d4", name: "Zaświadczenie o dochodach", state: "missing", note: "Wysłano przypomnienie" },
          { id: "d5", name: "Dokumenty dotyczące nieruchomości", state: "not_applicable", note: "Klient nie posiada nieruchomości" }
        ],
        attachments: [
          { name: "raport-bik-demo.pdf", size: "1,8 MB", date: "22 wrz 2026, 10:13" },
          { name: "wyciagi-bankowe-demo.zip", size: "4,2 MB", date: "22 wrz 2026, 10:16" },
          { name: "zaswiadczenie-zus-demo.pdf", size: "620 KB", date: "22 wrz 2026, 10:19" }
        ],
        tasks: [
          { id: "t1", title: "Skontaktuj się w sprawie brakujących dokumentów", due: "Dzisiaj, 12:00", priority: "high", done: false },
          { id: "t2", title: "Zweryfikuj listę wierzycieli", due: "24 wrz, 10:00", priority: "normal", done: false },
          { id: "t3", title: "Potwierdź otrzymanie wpłaty", due: "Wykonano wczoraj", priority: "normal", done: true }
        ],
        notes: [
          { author: "Ania Kowalska", at: "dzisiaj, 08:15", text: "Klientka potwierdziła, że prześle brakujące umowy po południu." },
          { author: "Mariusz Sztandera", at: "22 wrz, 16:40", text: "Wstępna analiza nie wykazała przeszkód do dalszej pracy nad wnioskiem." }
        ],
        history: [
          { title: "Dodano notatkę do sprawy", detail: "Ania Kowalska", at: "dzisiaj, 08:15" },
          { title: "Dokumenty oznaczono jako niekompletne", detail: "Brakuje 2 pozycji z listy", at: "22 wrz, 16:42" },
          { title: "Płatność została potwierdzona", detail: "2 000,00 zł · przelew bankowy", at: "22 wrz, 14:07" },
          { title: "Otrzymano ankietę", detail: "Zapisano dowód akceptacji i zgody", at: "22 wrz, 09:42" }
        ],
        consent: { regulation: true, privacy: true, sensitive: true, hash: "wh8H88iAhwTthTfmZvBY3s4oKCKfO3dISr7LMuMtvUM" }
      },
      {
        id: "DEMO-2026-002",
        ref: "PU-DEMO-C48B21",
        name: "Piotr Testowy",
        initials: "PT",
        email: "piotr.testowy@example.com",
        phone: "+48 600 100 202",
        city: "Poznań",
        createdAt: "21 wrz 2026, 14:18",
        updatedAt: "wczoraj, 17:05",
        status: "analysis",
        payment: "awaiting",
        materials: "not_verified",
        stage: 2,
        owner: "Mariusz Sztandera",
        amount: 2000,
        term: "5 paź 2026, 15:30",
        nextAction: "Sprawdź zaksięgowanie przelewu",
        nextActionDue: "Dzisiaj do 14:00",
        attention: "Płatność oczekuje 2 dni",
        priority: "high",
        pesel: "DEMO-PESEL-002",
        idNumber: "DOWOD-DEMO-002",
        address: "Fikcyjny adres demonstracyjny 2, Poznań",
        questionnaire: {
          maritalStatus: "Żonaty",
          household: "4 osoby",
          employment: "Umowa zlecenie",
          income: "4 400,00 zł netto",
          expenses: "4 700,00 zł miesięcznie",
          assets: "Brak istotnego majątku",
          health: "Pole demonstracyjne: brak danych i zgody",
          realEstate: "Brak",
          arrearsSince: "styczeń 2024",
          business: "Nigdy nie prowadził działalności"
        },
        creditors: [
          { name: "Bank Demonstracyjny S.A.", kind: "Karta kredytowa", amount: 12800, disputed: false },
          { name: "Pożyczka Test sp. z o.o.", kind: "Pożyczka", amount: 29600, disputed: false }
        ],
        documents: [
          { id: "d1", name: "Raport BIK", state: "missing", note: "Nie przesłano" },
          { id: "d2", name: "Umowy kredytowe i pożyczkowe", state: "missing", note: "Nie zweryfikowano" },
          { id: "d3", name: "Wyciągi bankowe za 6 miesięcy", state: "missing", note: "Nie zweryfikowano" },
          { id: "d4", name: "Zaświadczenie o dochodach", state: "received", note: "1 plik PDF" }
        ],
        attachments: [{ name: "dochody-piotr-demo.pdf", size: "740 KB", date: "21 wrz 2026, 14:40" }],
        tasks: [
          { id: "t1", title: "Sprawdź zaksięgowanie przelewu", due: "Dzisiaj, 14:00", priority: "high", done: false },
          { id: "t2", title: "Rozpocznij weryfikację dokumentów", due: "Po potwierdzeniu wpłaty", priority: "normal", done: false }
        ],
        notes: [{ author: "Mariusz Sztandera", at: "wczoraj, 17:05", text: "Klient deklaruje przelew wykonany wczoraj wieczorem." }],
        history: [
          { title: "Wysłano instrukcję płatności", detail: "E-mail do klienta", at: "21 wrz, 14:19" },
          { title: "Otrzymano ankietę", detail: "Zapisano dowód akceptacji", at: "21 wrz, 14:18" }
        ],
        consent: { regulation: true, privacy: true, sensitive: false, hash: "demoHashPiotr93jdx72Klm" }
      },
      {
        id: "DEMO-2026-003",
        ref: "PU-DEMO-F93D70",
        name: "Katarzyna Demo",
        initials: "KD",
        email: "katarzyna.demo@example.com",
        phone: "+48 600 100 203",
        city: "Gdańsk",
        createdAt: "18 wrz 2026, 11:06",
        updatedAt: "dzisiaj, 09:02",
        status: "in_progress",
        payment: "paid",
        materials: "complete",
        stage: 4,
        owner: "Ania Kowalska",
        amount: 2000,
        term: "2 paź 2026, 11:00",
        nextAction: "Dokończ projekt uzasadnienia wniosku",
        nextActionDue: "Jutro do 15:00",
        attention: "Termin za 9 dni",
        priority: "normal",
        pesel: "DEMO-PESEL-003",
        idNumber: "DOWOD-DEMO-003",
        address: "Fikcyjny adres demonstracyjny 3, Gdańsk",
        questionnaire: {
          maritalStatus: "Panna",
          household: "1 osoba",
          employment: "Umowa o pracę",
          income: "6 100,00 zł netto",
          expenses: "5 350,00 zł miesięcznie",
          assets: "Udział 1/8 w nieruchomości",
          health: "Pole demonstracyjne: odrębna zgoda zaznaczona",
          realEstate: "Udział spadkowy",
          arrearsSince: "listopad 2022",
          business: "Działalność zamknięta w 2020 r."
        },
        creditors: [
          { name: "Bank Wzorcowy S.A.", kind: "Kredyt konsolidacyjny", amount: 110400, disputed: false },
          { name: "Operator Demo S.A.", kind: "Usługi telekomunikacyjne", amount: 1900, disputed: false },
          { name: "Fundusz Testowy", kind: "Cesja wierzytelności", amount: 26700, disputed: false }
        ],
        documents: [
          { id: "d1", name: "Raport BIK", state: "received", note: "Zweryfikowano" },
          { id: "d2", name: "Umowy kredytowe i pożyczkowe", state: "received", note: "Zweryfikowano" },
          { id: "d3", name: "Wyciągi bankowe za 6 miesięcy", state: "received", note: "Zweryfikowano" },
          { id: "d4", name: "Zaświadczenie o dochodach", state: "received", note: "Zweryfikowano" },
          { id: "d5", name: "Dokumenty dotyczące nieruchomości", state: "received", note: "Zweryfikowano" }
        ],
        attachments: [
          { name: "pakiet-dokumentow-demo.zip", size: "8,3 MB", date: "19 wrz 2026, 09:12" },
          { name: "projekt-roboczy-v1-demo.docx", size: "192 KB", date: "22 wrz 2026, 16:22" }
        ],
        tasks: [
          { id: "t1", title: "Dokończ projekt uzasadnienia wniosku", due: "Jutro, 15:00", priority: "normal", done: false },
          { id: "t2", title: "Zweryfikuj wartości wierzytelności", due: "Wykonano 21 września", priority: "normal", done: true }
        ],
        notes: [{ author: "Ania Kowalska", at: "dzisiaj, 09:02", text: "Projekt wniosku przygotowany w około 70%. Pozostało dopracowanie uzasadnienia." }],
        history: [
          { title: "Zaktualizowano postęp realizacji", detail: "Projekt wniosku: 70%", at: "dzisiaj, 09:02" },
          { title: "Dokumenty oznaczono jako kompletne", detail: "Weryfikacja zakończona", at: "19 wrz, 12:30" },
          { title: "Płatność została potwierdzona", detail: "2 000,00 zł", at: "18 wrz, 13:45" },
          { title: "Otrzymano ankietę", detail: "Zapisano dowód akceptacji", at: "18 wrz, 11:06" }
        ],
        consent: { regulation: true, privacy: true, sensitive: true, hash: "demoHashKatarzyna21ppQz" }
      },
      {
        id: "DEMO-2026-004",
        ref: "PU-DEMO-B12E55",
        name: "Tomasz Przykład",
        initials: "TP",
        email: "tomasz.przyklad@example.com",
        phone: "+48 600 100 204",
        city: "Łódź",
        createdAt: "22 wrz 2026, 16:31",
        updatedAt: "22 wrz, 17:10",
        status: "contacted",
        payment: "not_set",
        materials: "not_verified",
        stage: 1,
        owner: "Ania Kowalska",
        amount: 2000,
        term: "Do ustalenia",
        nextAction: "Umów rozmowę wstępną",
        nextActionDue: "Dzisiaj do 16:00",
        attention: "Brak terminu rozmowy",
        priority: "normal",
        pesel: "DEMO-PESEL-004",
        idNumber: "DOWOD-DEMO-004",
        address: "Fikcyjny adres demonstracyjny 4, Łódź",
        questionnaire: {
          maritalStatus: "Żonaty",
          household: "3 osoby",
          employment: "Bezrobotny",
          income: "1 800,00 zł",
          expenses: "3 600,00 zł miesięcznie",
          assets: "Samochód osobowy, rok 2008",
          health: "Pole demonstracyjne: brak danych i zgody",
          realEstate: "Brak",
          arrearsSince: "maj 2024",
          business: "Nigdy nie prowadził działalności"
        },
        creditors: [{ name: "Bank Szkoleniowy S.A.", kind: "Kredyt", amount: 63200, disputed: false }],
        documents: [
          { id: "d1", name: "Raport BIK", state: "missing", note: "Nie zweryfikowano" },
          { id: "d2", name: "Umowy kredytowe i pożyczkowe", state: "missing", note: "Nie zweryfikowano" }
        ],
        attachments: [],
        tasks: [{ id: "t1", title: "Umów rozmowę wstępną", due: "Dzisiaj, 16:00", priority: "normal", done: false }],
        notes: [{ author: "Ania Kowalska", at: "22 wrz, 17:10", text: "Pierwsza próba kontaktu — klient prosił o telefon następnego dnia." }],
        history: [
          { title: "Odnotowano próbę kontaktu", detail: "Telefonicznie", at: "22 wrz, 17:10" },
          { title: "Otrzymano ankietę", detail: "Zapisano dowód akceptacji", at: "22 wrz, 16:31" }
        ],
        consent: { regulation: true, privacy: true, sensitive: false, hash: "demoHashTomasz11zxCv" }
      },
      {
        id: "DEMO-2026-005",
        ref: "PU-DEMO-D65A88",
        name: "Maria Szkoleniowa",
        initials: "MS",
        email: "maria.szkoleniowa@example.com",
        phone: "+48 600 100 205",
        city: "Kraków",
        createdAt: "dzisiaj, 07:54",
        updatedAt: "dzisiaj, 07:54",
        status: "new",
        payment: "not_set",
        materials: "not_verified",
        stage: 1,
        owner: "Nieprzypisana",
        amount: 2000,
        term: "Do ustalenia",
        nextAction: "Przeczytaj ankietę i przypisz prowadzącego",
        nextActionDue: "Dzisiaj do 10:00",
        attention: "Nowa ankieta",
        priority: "high",
        pesel: "DEMO-PESEL-005",
        idNumber: "DOWOD-DEMO-005",
        address: "Fikcyjny adres demonstracyjny 5, Kraków",
        questionnaire: {
          maritalStatus: "Mężatka",
          household: "2 osoby",
          employment: "Emerytura",
          income: "3 100,00 zł netto",
          expenses: "2 950,00 zł miesięcznie",
          assets: "Brak istotnego majątku",
          health: "Pole demonstracyjne: odrębna zgoda zaznaczona",
          realEstate: "Brak",
          arrearsSince: "luty 2022",
          business: "Nigdy nie prowadziła działalności"
        },
        creditors: [
          { name: "Bank Demo S.A.", kind: "Kredyt", amount: 34700, disputed: false },
          { name: "Fundusz Pokazowy", kind: "Cesja", amount: 11300, disputed: false }
        ],
        documents: [{ id: "d1", name: "Raport BIK", state: "missing", note: "Nie zweryfikowano" }],
        attachments: [],
        tasks: [{ id: "t1", title: "Przeczytaj ankietę i przypisz prowadzącego", due: "Dzisiaj, 10:00", priority: "high", done: false }],
        notes: [],
        history: [{ title: "Otrzymano nową ankietę", detail: "Sprawa oczekuje na przypisanie", at: "dzisiaj, 07:54" }],
        consent: { regulation: true, privacy: true, sensitive: true, hash: "demoHashMaria77bnMa" }
      },
      {
        id: "DEMO-2026-006",
        ref: "PU-DEMO-E24F19",
        name: "Jan Archiwalny",
        initials: "JA",
        email: "jan.archiwalny@example.com",
        phone: "+48 600 100 206",
        city: "Szczecin",
        createdAt: "3 sie 2026, 12:20",
        updatedAt: "15 wrz, 13:04",
        status: "completed",
        payment: "paid",
        materials: "complete",
        stage: 5,
        owner: "Mariusz Sztandera",
        amount: 2000,
        term: "Zrealizowano 15 wrz 2026",
        nextAction: "Brak — sprawa zakończona",
        nextActionDue: "—",
        attention: "Archiwizacja za 71 dni",
        priority: "low",
        pesel: "DEMO-PESEL-006",
        idNumber: "DOWOD-DEMO-006",
        address: "Fikcyjny adres demonstracyjny 6, Szczecin",
        questionnaire: {
          maritalStatus: "Kawaler",
          household: "1 osoba",
          employment: "Umowa o pracę",
          income: "4 900,00 zł netto",
          expenses: "4 200,00 zł miesięcznie",
          assets: "Brak",
          health: "Pole demonstracyjne: brak danych i zgody",
          realEstate: "Brak",
          arrearsSince: "2020",
          business: "Nie dotyczy"
        },
        creditors: [{ name: "Bank Archiwalny S.A.", kind: "Kredyt", amount: 55000, disputed: false }],
        documents: [{ id: "d1", name: "Komplet dokumentów", state: "received", note: "Zweryfikowano" }],
        attachments: [{ name: "finalny-pakiet-demo.zip", size: "6,1 MB", date: "15 wrz 2026, 12:55" }],
        tasks: [{ id: "t1", title: "Przekaż gotowy projekt klientowi", due: "Wykonano 15 września", priority: "normal", done: true }],
        notes: [{ author: "Mariusz Sztandera", at: "15 wrz, 13:04", text: "Projekt przekazany klientowi. Sprawa zamknięta jako zrealizowana." }],
        history: [
          { title: "Sprawa została zakończona", detail: "Usługa zrealizowana", at: "15 wrz, 13:04" },
          { title: "Przekazano gotowy projekt", detail: "E-mail do klienta", at: "15 wrz, 12:58" },
          { title: "Otrzymano ankietę", detail: "Zapisano dowód akceptacji", at: "3 sie, 12:20" }
        ],
        consent: { regulation: true, privacy: true, sensitive: false, hash: "demoHashJan99ghTy" }
      }
    ],
    invitations: [
      { id: "INV-DEMO-41A8", recipient: "Ewa Próbna", email: "ewa.probna@example.com", created: "22 wrz 2026, 15:40", expires: "29 wrz 2026, 15:40", status: "active" },
      { id: "INV-DEMO-92C1", recipient: "Adam Pokazowy", email: "adam.pokazowy@example.com", created: "21 wrz 2026, 10:12", expires: "28 wrz 2026, 10:12", status: "active" },
      { id: "INV-DEMO-13F7", recipient: "Joanna Testowa", email: "joanna.testowa@example.com", created: "14 wrz 2026, 13:05", expires: "21 wrz 2026, 13:05", status: "expired" }
    ],
    audit: [
      { at: "23 wrz 2026, 09:02", actor: "Ania Kowalska", action: "Zmieniono postęp sprawy", detail: "PU-DEMO-F93D70 · realizacja 70%" },
      { at: "23 wrz 2026, 08:15", actor: "Ania Kowalska", action: "Dodano notatkę", detail: "PU-DEMO-A71C93" },
      { at: "22 wrz 2026, 16:42", actor: "Mariusz Sztandera", action: "Zmieniono kompletność dokumentów", detail: "PU-DEMO-A71C93 · niekompletne" },
      { at: "22 wrz 2026, 14:07", actor: "Mariusz Sztandera", action: "Potwierdzono płatność", detail: "PU-DEMO-A71C93 · 2 000,00 zł" },
      { at: "22 wrz 2026, 09:42", actor: "System", action: "Utworzono sprawę", detail: "PU-DEMO-A71C93 · formularz ankiety" }
    ]
  };

  const state = {
    role: "admin",
    caseSearch: "",
    caseStatus: "all",
    caseSort: "updated",
    revealed: new Set(),
    notificationRead: false,
    modalHandler: null,
    cases: structuredClone(fixtures.cases),
    invitations: structuredClone(fixtures.invitations),
    audit: structuredClone(fixtures.audit)
  };

  const dom = {
    body: document.body,
    root: document.getElementById("view-root"),
    breadcrumbs: document.getElementById("breadcrumbs"),
    rolePreview: document.getElementById("role-preview"),
    userName: document.getElementById("user-name"),
    userRole: document.getElementById("user-role"),
    userAvatar: document.getElementById("user-avatar"),
    userMenuButton: document.getElementById("user-menu-button"),
    userPopover: document.getElementById("user-popover"),
    notificationsButton: document.getElementById("notifications-button"),
    notificationsClose: document.getElementById("notifications-close"),
    notificationPanel: document.getElementById("notification-panel"),
    notificationList: document.getElementById("notification-list"),
    menuButton: document.getElementById("menu-button"),
    sidebarClose: document.getElementById("sidebar-close"),
    sidebarScrim: document.getElementById("sidebar-scrim"),
    modal: document.getElementById("action-modal"),
    modalForm: document.getElementById("action-modal-form"),
    modalTitle: document.getElementById("modal-title"),
    modalEyebrow: document.getElementById("modal-eyebrow"),
    modalBody: document.getElementById("modal-body"),
    modalConfirm: document.getElementById("modal-confirm"),
    toastRegion: document.getElementById("toast-region"),
    navCasesCount: document.getElementById("nav-cases-count"),
    navInvitationsCount: document.getElementById("nav-invitations-count")
  };

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function icon(name, className = "") {
    return `<svg class="icon ${className}" aria-hidden="true"><use href="#icon-${escapeHTML(name)}"></use></svg>`;
  }

  function money(value) {
    return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);
  }

  function todayLabel() {
    return new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      .format(new Date("2026-09-23T09:30:00Z"));
  }

  function statusBadge(status, labels = STATUS_LABELS) {
    return `<span class="status-badge status-${escapeHTML(status)}">${escapeHTML(labels[status] || status)}</span>`;
  }

  function priorityBadge(priority) {
    const labels = { high: "Pilne", normal: "Standard", low: "Niski priorytet" };
    return `<span class="priority-badge priority-${escapeHTML(priority)}">${labels[priority] || priority}</span>`;
  }

  function activeCases() {
    return state.cases.filter((item) => !["completed", "rejected"].includes(item.status));
  }

  function getCase(id) {
    return state.cases.find((item) => item.id === id);
  }

  function getRoute() {
    const raw = window.location.hash.replace(/^#\/?/, "") || "dashboard";
    const parts = raw.split("/").filter(Boolean).map(decodeURIComponent);
    if (parts[0] === "case") {
      return { name: "case", id: parts[1], tab: parts[2] || "overview" };
    }
    return { name: parts[0] || "dashboard" };
  }

  function navigate(hash) {
    if (window.location.hash === hash) {
      render();
    } else {
      window.location.hash = hash;
    }
  }

  function setBreadcrumbs(items) {
    dom.breadcrumbs.innerHTML = items.map((item, index) => {
      const last = index === items.length - 1;
      const content = item.href && !last
        ? `<a class="breadcrumb-parent" href="${escapeHTML(item.href)}">${escapeHTML(item.label)}</a>`
        : `<span class="${last ? "breadcrumb-current" : "breadcrumb-parent"}">${escapeHTML(item.label)}</span>`;
      return `${index ? '<span class="breadcrumb-separator">/</span>' : ""}${content}`;
    }).join("");
  }

  function pageHead({ eyebrow, title, subtitle, actions = "" }) {
    return `
      <div class="page-head">
        <div class="page-title-wrap">
          ${eyebrow ? `<span class="eyebrow">${escapeHTML(eyebrow)}</span>` : ""}
          <h1>${escapeHTML(title)}</h1>
          ${subtitle ? `<p class="page-subtitle">${escapeHTML(subtitle)}</p>` : ""}
        </div>
        ${actions ? `<div class="page-actions">${actions}</div>` : ""}
      </div>`;
  }

  function metricCard(label, value, detail, iconName, color = "var(--blue-600)", tint = "var(--blue-100)") {
    return `
      <article class="card metric-card" style="--metric-color:${color};--metric-tint:${tint}">
        <div class="metric-top"><span>${escapeHTML(label)}</span><span class="metric-icon">${icon(iconName)}</span></div>
        <strong class="metric-value">${escapeHTML(value)}</strong>
        <span class="metric-detail">${escapeHTML(detail)}</span>
      </article>`;
  }

  function openModal({ title, eyebrow = "Działanie demonstracyjne", body, confirm = "Potwierdź", handler, danger = false }) {
    dom.modalTitle.textContent = title;
    dom.modalEyebrow.textContent = eyebrow;
    dom.modalBody.innerHTML = body;
    dom.modalConfirm.textContent = confirm;
    dom.modalConfirm.className = `button ${danger ? "button-danger" : "button-primary"}`;
    state.modalHandler = handler || null;
    if (typeof dom.modal.showModal === "function") dom.modal.showModal();
    else dom.modal.setAttribute("open", "");
    requestAnimationFrame(() => dom.modalBody.querySelector("input, select, textarea")?.focus());
  }

  function closeModal() {
    if (typeof dom.modal.close === "function") dom.modal.close();
    else dom.modal.removeAttribute("open");
    state.modalHandler = null;
  }

  function toast(title, detail, type = "default") {
    const item = document.createElement("div");
    item.className = `toast ${type}`;
    item.innerHTML = `${icon(type === "success" ? "check" : type === "warning" ? "bell" : "shield")}<div><strong>${escapeHTML(title)}</strong><span>${escapeHTML(detail)}</span></div>`;
    dom.toastRegion.append(item);
    window.setTimeout(() => item.remove(), 4300);
  }

  function addAudit(action, detail) {
    state.audit.unshift({
      at: "23 wrz 2026, przed chwilą",
      actor: state.role === "admin" ? "Mariusz Sztandera" : "Ania Kowalska",
      action,
      detail
    });
  }

  function updateChrome(route) {
    const operator = state.role === "operator";
    document.querySelectorAll("[data-admin-only]").forEach((element) => {
      element.hidden = operator;
    });
    dom.userName.textContent = operator ? "Ania Kowalska" : "Mariusz Sztandera";
    dom.userRole.textContent = operator ? "Operator" : "Administrator";
    dom.userAvatar.textContent = operator ? "AK" : "MS";
    dom.navCasesCount.textContent = String(activeCases().length);
    dom.navInvitationsCount.textContent = String(state.invitations.filter((item) => item.status === "active").length);

    const activeName = route.name === "case" ? "cases" : route.name;
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.route === activeName);
    });
    renderNotifications();
  }

  function renderNotifications() {
    const items = [
      { caseId: "DEMO-2026-005", title: "Nowa ankieta czeka na przypisanie", meta: "Maria Szkoleniowa · dzisiaj, 07:54", tone: "#1769e0" },
      { caseId: "DEMO-2026-001", title: "Termin zadania upływa dzisiaj", meta: "Brakujące dokumenty · 12:00", tone: "#b92d34" },
      { caseId: "DEMO-2026-002", title: "Płatność nadal niepotwierdzona", meta: "Piotr Testowy · oczekuje 2 dni", tone: "#9a5a05" }
    ];
    dom.notificationList.innerHTML = items.map((item) => `
      <button class="notification-item" type="button" data-action="notification-case" data-case-id="${item.caseId}" style="width:100%;border:0;background:transparent;text-align:left">
        <span class="attention-marker" style="--marker-color:${item.tone};--marker-bg:#eef3f9"></span>
        <span class="item-copy"><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.meta)}</span></span>
        ${icon("arrow", "icon-small")}
      </button>`).join("");
  }

  function renderDashboard() {
    setBreadcrumbs([{ label: "Pulpit" }]);
    const tasks = state.cases
      .flatMap((caseItem) => caseItem.tasks.filter((task) => !task.done).map((task) => ({ ...task, caseItem })))
      .sort((a, b) => (a.priority === "high" ? -1 : 1) - (b.priority === "high" ? -1 : 1))
      .slice(0, 5);
    const urgent = tasks.filter((task) => task.priority === "high").length;
    const waiting = activeCases().filter((item) => item.payment === "awaiting").length;
    const missingDocs = activeCases().filter((item) => item.materials === "incomplete").length;
    const greeting = state.role === "admin" ? "Dzień dobry, Mariusz" : "Dzień dobry, Aniu";

    dom.root.innerHTML = `
      <section class="page dashboard-page">
        ${pageHead({
          eyebrow: todayLabel(),
          title: greeting,
          subtitle: "Poniżej najważniejsze sprawy i zadania wymagające dziś Twojej uwagi.",
          actions: `<button class="button button-primary" type="button" data-action="new-invitation">${icon("plus")}Nowy link do ankiety</button>`
        })}
        <div class="metric-grid">
          ${metricCard("Aktywne sprawy", activeCases().length, "1 nowa od ostatniej wizyty", "cases")}
          ${metricCard("Zadania pilne", urgent, "Do wykonania dzisiaj", "task", "var(--danger)", "var(--danger-bg)")}
          ${metricCard("Płatności oczekujące", waiting, "Łącznie 2 000,00 zł", "creditor", "var(--warning)", "var(--warning-bg)")}
          ${metricCard("Braki w dokumentach", missingDocs, "Wymagają kontaktu z klientem", "file", "var(--purple)", "var(--purple-bg)")}
        </div>
        <div class="dashboard-grid">
          <div class="dashboard-stack">
            <section class="card">
              <div class="card-head">
                <div><h2>Do zrobienia dzisiaj</h2><p class="section-copy">Lista operacyjna ułożona według pilności.</p></div>
                <a class="button button-quiet button-small" href="#cases">Wszystkie sprawy ${icon("arrow")}</a>
              </div>
              <ul class="task-list">
                ${tasks.map((task) => `
                  <li class="task-item">
                    <button class="task-checkbox" type="button" aria-label="Oznacz zadanie jako wykonane" data-action="toggle-task" data-case-id="${task.caseItem.id}" data-task-id="${task.id}"></button>
                    <a class="item-copy" href="#case/${task.caseItem.id}/overview" style="text-decoration:none">
                      <strong>${escapeHTML(task.title)}</strong>
                      <span>${escapeHTML(task.caseItem.name)} · ${escapeHTML(task.caseItem.ref)}</span>
                    </a>
                    <div class="item-side">${priorityBadge(task.priority)}<span style="display:block;margin-top:4px">${escapeHTML(task.due)}</span></div>
                  </li>`).join("")}
              </ul>
            </section>
            <section class="card">
              <div class="card-head"><div><h2>Sprawy wymagające uwagi</h2><p class="section-copy">Ryzyka i opóźnienia wychwycone przez panel.</p></div></div>
              <div>
                ${activeCases().filter((item) => item.attention).slice(0, 4).map((item) => `
                  <a class="attention-item" href="#case/${item.id}/overview">
                    <span class="attention-marker" style="--marker-color:${item.priority === "high" ? "var(--danger)" : "var(--warning)"};--marker-bg:${item.priority === "high" ? "var(--danger-bg)" : "var(--warning-bg)"}"></span>
                    <span class="item-copy"><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.attention)}</span></span>
                    ${statusBadge(item.status)}
                    <span class="item-arrow">${icon("arrow", "icon-small")}</span>
                  </a>`).join("")}
              </div>
            </section>
          </div>
          <aside class="side-stack">
            <section class="card">
              <div class="card-head"><div><h2>Ostatnia aktywność</h2><p class="section-copy">Zmiany z dzisiaj i wczoraj.</p></div></div>
              <ul class="activity-list">
                ${state.audit.slice(0, 5).map((event) => `
                  <li class="activity-item">
                    <span class="activity-icon">${icon(event.actor === "System" ? "shield" : "history")}</span>
                    <span class="item-copy"><strong>${escapeHTML(event.action)}</strong><span>${escapeHTML(event.detail)} · ${escapeHTML(event.actor)}</span></span>
                    <span class="item-side">${escapeHTML(event.at.split(", ").slice(-1)[0])}</span>
                  </li>`).join("")}
              </ul>
            </section>
            <section class="card">
              <div class="card-head no-border"><div><span class="eyebrow">Stan systemu</span><h2>Wszystko działa</h2></div>${statusBadge("active", { active: "Online" })}</div>
              <div class="card-body" style="padding-top:8px">
                <div class="kpi-line"><span>Formularz ankiety</span><strong>Aktywny</strong></div>
                <div class="kpi-line"><span>Wysyłka e-mail</span><strong>2 odbiorców</strong></div>
                <div class="kpi-line"><span>Ostatnia kopia</span><strong>Dzisiaj, 02:00</strong></div>
                <div class="kpi-line"><span>Sesja</span><strong>Chroniona MFA</strong></div>
              </div>
            </section>
          </aside>
        </div>
      </section>`;
  }

  function sortCases(cases) {
    const copy = [...cases];
    if (state.caseSort === "name") copy.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    if (state.caseSort === "status") copy.sort((a, b) => STATUS_LABELS[a.status].localeCompare(STATUS_LABELS[b.status], "pl"));
    if (state.caseSort === "updated") {
      const recency = ["DEMO-2026-005", "DEMO-2026-003", "DEMO-2026-001", "DEMO-2026-004", "DEMO-2026-002", "DEMO-2026-006"];
      copy.sort((a, b) => recency.indexOf(a.id) - recency.indexOf(b.id));
    }
    return copy;
  }

  function renderCases() {
    setBreadcrumbs([{ label: "Sprawy" }]);
    const query = state.caseSearch.trim().toLowerCase();
    const visible = sortCases(state.cases.filter((item) => {
      const matchesStatus = state.caseStatus === "all" || item.status === state.caseStatus;
      const haystack = `${item.name} ${item.ref} ${item.email} ${item.phone}`.toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    }));

    dom.root.innerHTML = `
      <section class="page">
        ${pageHead({
          eyebrow: "Obsługa klientów",
          title: "Sprawy",
          subtitle: "Wszystkie zgłoszenia, ich bieżący etap i następne działania.",
          actions: `<button class="button button-primary" type="button" data-action="new-invitation">${icon("plus")}Nowy link do ankiety</button>`
        })}
        <section class="card table-card">
          <div class="table-tools">
            <div class="table-tools-left">
              <label class="search-field">
                <span class="sr-only" hidden>Szukaj sprawy</span>${icon("search")}
                <input class="field" id="case-search" type="search" value="${escapeHTML(state.caseSearch)}" placeholder="Szukaj po nazwisku, numerze lub e-mailu">
              </label>
              <select class="select-field" id="case-status" aria-label="Filtr statusu">
                <option value="all">Wszystkie statusy</option>
                ${Object.entries(STATUS_LABELS).map(([value, label]) => `<option value="${value}" ${state.caseStatus === value ? "selected" : ""}>${escapeHTML(label)}</option>`).join("")}
              </select>
            </div>
            <div class="table-tools-right">
              <select class="select-field" id="case-sort" aria-label="Sortowanie">
                <option value="updated" ${state.caseSort === "updated" ? "selected" : ""}>Ostatnio aktualizowane</option>
                <option value="name" ${state.caseSort === "name" ? "selected" : ""}>Nazwisko A–Z</option>
                <option value="status" ${state.caseSort === "status" ? "selected" : ""}>Według statusu</option>
              </select>
            </div>
          </div>
          ${visible.length ? `
            <div style="overflow-x:auto">
              <table class="data-table responsive-table">
                <thead><tr><th>Klient i numer sprawy</th><th>Status</th><th>Płatność</th><th>Dokumenty</th><th>Następne działanie</th><th>Prowadzący</th></tr></thead>
                <tbody>
                  ${visible.map((item) => `
                    <tr class="clickable" tabindex="0" data-action="open-case" data-case-id="${item.id}">
                      <td class="primary-cell"><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.ref)} · ${escapeHTML(item.city)}</span></td>
                      <td data-label="Status">${statusBadge(item.status)}</td>
                      <td data-label="Płatność">${statusBadge(item.payment, PAYMENT_LABELS)}</td>
                      <td data-label="Dokumenty">${statusBadge(item.materials, MATERIAL_LABELS)}</td>
                      <td data-label="Następne działanie"><strong style="display:block;color:var(--ink-800);font-size:11.5px">${escapeHTML(item.nextAction)}</strong><span style="color:${item.priority === "high" ? "var(--danger)" : "var(--ink-500)"};font-size:10.5px">${escapeHTML(item.nextActionDue)}</span></td>
                      <td data-label="Prowadzący">${escapeHTML(item.owner)}</td>
                    </tr>`).join("")}
                </tbody>
              </table>
            </div>` : `<div class="empty-state"><span class="empty-state-icon">${icon("search")}</span><h2>Brak pasujących spraw</h2><p>Zmień wyszukiwaną frazę albo filtr statusu.</p></div>`}
          <div class="pagination-bar"><span>Wyświetlono ${visible.length} z ${state.cases.length} spraw demonstracyjnych</span><span>Dane fikcyjne · bez połączenia z produkcją</span></div>
        </section>
      </section>`;
  }

  function caseHero(caseItem) {
    return `
      <section class="card case-hero">
        <div class="case-hero-main">
          <div class="case-identity">
            <span class="case-avatar">${escapeHTML(caseItem.initials)}</span>
            <div>
              <div class="case-title-row"><h1>${escapeHTML(caseItem.name)}</h1>${statusBadge(caseItem.status)}</div>
              <div class="case-reference">${escapeHTML(caseItem.ref)} · sprawa demonstracyjna</div>
            </div>
          </div>
          <div class="case-contact-actions">
            <button class="button button-secondary button-small" type="button" data-action="contact" data-channel="phone" data-case-id="${caseItem.id}">${icon("phone")}Zadzwoń</button>
            <button class="button button-secondary button-small" type="button" data-action="contact" data-channel="mail" data-case-id="${caseItem.id}">${icon("mail")}Napisz</button>
            <button class="button button-quiet button-small" type="button" data-action="case-menu" data-case-id="${caseItem.id}">${icon("more")}Więcej</button>
          </div>
        </div>
        <div class="case-meta-strip">
          <div class="case-meta-item"><span>Telefon</span><strong>${escapeHTML(caseItem.phone)}</strong></div>
          <div class="case-meta-item"><span>E-mail</span><strong>${escapeHTML(caseItem.email)}</strong></div>
          <div class="case-meta-item"><span>Prowadzący</span><strong>${escapeHTML(caseItem.owner)}</strong></div>
          <div class="case-meta-item"><span>Ostatnia zmiana</span><strong>${escapeHTML(caseItem.updatedAt)}</strong></div>
        </div>
      </section>`;
  }

  function caseStage(caseItem) {
    const stages = ["Zamówienie", "Płatność", "Dokumenty", "Realizacja", "Zakończenie"];
    const progress = Math.max(0, Math.min(100, ((caseItem.stage - 1) / 4) * 80));
    return `
      <section class="card stage-card" aria-label="Etap sprawy">
        <div class="stage-track">
          <span class="stage-progress" style="width:${progress}%"></span>
          ${stages.map((label, index) => {
            const step = index + 1;
            const cls = step < caseItem.stage ? "done" : step === caseItem.stage ? "current" : "";
            return `<div class="stage-step ${cls}"><span class="stage-dot">${step < caseItem.stage ? icon("check") : step}</span><span>${label}</span></div>`;
          }).join("")}
        </div>
      </section>`;
  }

  function caseTabs(caseItem, activeTab) {
    return `<nav class="case-tabs" aria-label="Sekcje sprawy">${CASE_TABS.map(([id, label]) => `<a class="case-tab ${activeTab === id ? "active" : ""}" href="#case/${caseItem.id}/${id}">${escapeHTML(label)}</a>`).join("")}</nav>`;
  }

  function taskList(caseItem) {
    return caseItem.tasks.map((task) => `
      <li class="task-item">
        <button class="task-checkbox ${task.done ? "done" : ""}" type="button" aria-label="${task.done ? "Przywróć zadanie" : "Oznacz zadanie jako wykonane"}" data-action="toggle-task" data-case-id="${caseItem.id}" data-task-id="${task.id}">${task.done ? icon("check") : ""}</button>
        <span class="item-copy"><strong style="${task.done ? "text-decoration:line-through;color:var(--ink-500)" : ""}">${escapeHTML(task.title)}</strong><span>${escapeHTML(task.due)}</span></span>
        ${priorityBadge(task.priority)}
      </li>`).join("");
  }

  function checklist(caseItem, limit = Infinity) {
    return caseItem.documents.slice(0, limit).map((documentItem) => `
      <li class="checklist-item">
        <button class="check-state ${documentItem.state}" type="button" data-action="cycle-document" data-case-id="${caseItem.id}" data-document-id="${documentItem.id}" aria-label="Zmień status dokumentu">${documentItem.state === "received" ? icon("check") : documentItem.state === "not_applicable" ? "—" : ""}</button>
        <span class="checklist-copy"><strong>${escapeHTML(documentItem.name)}</strong><span>${escapeHTML(documentItem.note)}</span></span>
        <span class="status-badge status-${documentItem.state === "received" ? "complete" : documentItem.state === "missing" ? "incomplete" : "neutral"}">${escapeHTML(CHECK_LABELS[documentItem.state])}</span>
      </li>`).join("");
  }

  function renderOverview(caseItem) {
    const resolved = caseItem.documents.filter((item) => item.state !== "missing").length;
    const progress = Math.round((resolved / Math.max(1, caseItem.documents.length)) * 100);
    return `
      <div class="case-overview-grid">
        <div class="main-stack">
          <section class="card section-card">
            <div class="card-head"><div><h2>Zadania</h2><p class="section-copy">Konkretne czynności przypisane do tej sprawy.</p></div><button class="button button-secondary button-small" type="button" data-action="add-task" data-case-id="${caseItem.id}">${icon("plus")}Dodaj zadanie</button></div>
            <ul class="task-list">${taskList(caseItem)}</ul>
          </section>
          <section class="card section-card">
            <div class="card-head"><div><h2>Dokumenty klienta</h2><p class="section-copy">${resolved} z ${caseItem.documents.length} pozycji rozliczonych (otrzymano lub nie dotyczy).</p></div><a class="button button-quiet button-small" href="#case/${caseItem.id}/documents">Pełna lista ${icon("arrow")}</a></div>
            <div class="card-body" style="padding-top:14px;padding-bottom:4px">
              <div class="progress-block"><div class="progress-row"><span>Kompletność materiałów</span><strong>${progress}%</strong></div><div class="progress-bar"><span style="width:${progress}%"></span></div></div>
              <ul class="checklist" style="margin-top:10px">${checklist(caseItem, 4)}</ul>
            </div>
          </section>
        </div>
        <aside class="side-stack">
          <section class="card section-card">
            <div class="card-head"><div><h2>Podsumowanie sprawy</h2><p class="section-copy">Najważniejsze informacje operacyjne.</p></div></div>
            <div class="card-body">
              <div class="summary-grid">
                <div class="summary-item"><span>Status płatności</span><strong>${PAYMENT_LABELS[caseItem.payment]}</strong></div>
                <div class="summary-item"><span>Wartość usługi</span><strong>${money(caseItem.amount)}</strong></div>
                <div class="summary-item"><span>Dokumenty</span><strong>${MATERIAL_LABELS[caseItem.materials]}</strong></div>
                <div class="summary-item"><span>Termin</span><strong>${escapeHTML(caseItem.term)}</strong></div>
                <div class="summary-item full"><span>Łączne zadłużenie</span><strong>${money(caseItem.creditors.reduce((sum, item) => sum + item.amount, 0))}</strong></div>
              </div>
            </div>
          </section>
          <section class="card section-card">
            <div class="card-head"><div><h2>Notatki wewnętrzne</h2><p class="section-copy">Niewidoczne dla klienta.</p></div><button class="button button-secondary button-small" type="button" data-action="add-note" data-case-id="${caseItem.id}">${icon("plus")}Dodaj</button></div>
            <div class="card-body">
              ${caseItem.notes.length ? caseItem.notes.map((note) => `<article class="note"><div class="note-head"><strong>${escapeHTML(note.author)}</strong><time>${escapeHTML(note.at)}</time></div><p>${escapeHTML(note.text)}</p></article>`).join("") : `<div class="empty-state" style="padding:20px 5px"><p>Nie dodano jeszcze notatek.</p></div>`}
            </div>
          </section>
        </aside>
      </div>`;
  }

  function maskedField(caseItem, key, label, value, mask) {
    const revealKey = `${caseItem.id}:${key}`;
    const revealed = state.revealed.has(revealKey);
    return `
      <div class="data-item">
        <span>${escapeHTML(label)}</span>
        <div class="masked-value"><code>${escapeHTML(revealed ? value : mask)}</code><button class="reveal-button" type="button" data-action="reveal" data-case-id="${caseItem.id}" data-field="${key}" title="${revealed ? "Ukryj" : "Pokaż"} dane">${icon("eye")}</button></div>
      </div>`;
  }

  function renderQuestionnaire(caseItem) {
    const q = caseItem.questionnaire;
    return `
      <div class="main-stack">
        <div class="info-banner">${icon("lock")}<div><strong>Dane szczególnie chronione</strong>Dostęp do pól oznaczonych ikoną oka jest rejestrowany w dzienniku audytowym. W prototypie dane są fikcyjne.</div></div>
        <section class="card section-card">
          <div class="card-head"><div><h2>Dane identyfikacyjne i kontaktowe</h2><p class="section-copy">Dane podane przez klienta w ankiecie.</p></div><button class="button button-secondary button-small" type="button" data-action="mock-save">${icon("check")}Zapisz korekty</button></div>
          <div class="card-body"><div class="data-grid">
            <div class="data-item"><span>Imię i nazwisko</span><strong>${escapeHTML(caseItem.name)}</strong></div>
            <div class="data-item"><span>Miejscowość</span><strong>${escapeHTML(caseItem.city)}</strong></div>
            ${maskedField(caseItem, "pesel", "PESEL", caseItem.pesel, `DEMO-••••••-${caseItem.pesel.slice(-3)}`)}
            ${maskedField(caseItem, "idNumber", "Dokument tożsamości", caseItem.idNumber, `DOWOD-••••-${caseItem.idNumber.slice(-3)}`)}
            ${maskedField(caseItem, "address", "Adres zamieszkania", caseItem.address, "••••••••••••••••")}
            <div class="data-item"><span>Telefon</span><strong>${escapeHTML(caseItem.phone)}</strong></div>
            <div class="data-item full"><span>E-mail</span><strong>${escapeHTML(caseItem.email)}</strong></div>
          </div></div>
        </section>
        <section class="card section-card">
          <div class="card-head"><div><h2>Sytuacja życiowa i finansowa</h2><p class="section-copy">Uporządkowane odpowiedzi z formularza.</p></div></div>
          <div class="card-body"><div class="data-grid">
            <div class="data-item"><span>Stan cywilny</span><strong>${escapeHTML(q.maritalStatus)}</strong></div>
            <div class="data-item"><span>Gospodarstwo domowe</span><strong>${escapeHTML(q.household)}</strong></div>
            <div class="data-item"><span>Źródło dochodu</span><strong>${escapeHTML(q.employment)}</strong></div>
            <div class="data-item"><span>Dochód miesięczny</span><strong>${escapeHTML(q.income)}</strong></div>
            <div class="data-item"><span>Koszty miesięczne</span><strong>${escapeHTML(q.expenses)}</strong></div>
            <div class="data-item"><span>Niewypłacalność od</span><strong>${escapeHTML(q.arrearsSince)}</strong></div>
            <div class="data-item full"><span>Majątek</span><strong>${escapeHTML(q.assets)}</strong></div>
            <div class="data-item full"><span>Nieruchomości</span><strong>${escapeHTML(q.realEstate)}</strong></div>
            <div class="data-item full"><span>Działalność gospodarcza</span><strong>${escapeHTML(q.business)}</strong></div>
            <div class="data-item full"><span>Dane szczególnej kategorii</span><strong>${escapeHTML(q.health)}</strong><p>Zgoda: ${caseItem.consent.sensitive ? "udzielona" : "nie dotyczy"}</p></div>
          </div></div>
        </section>
        <section class="card section-card">
          <div class="card-head"><div><h2>Dowód akceptacji</h2><p class="section-copy">Stan zgód zapisany w chwili wysłania ankiety.</p></div>${statusBadge("active", { active: "Zweryfikowano" })}</div>
          <div class="card-body"><div class="data-grid">
            <div class="data-item"><span>Regulamin</span><strong>${caseItem.consent.regulation ? "Zaakceptowano" : "Brak"}</strong></div>
            <div class="data-item"><span>Polityka prywatności</span><strong>${caseItem.consent.privacy ? "Potwierdzono" : "Brak"}</strong></div>
            <div class="data-item"><span>Zgoda na dane szczególnej kategorii</span><strong>${caseItem.consent.sensitive ? "Wyrażono" : "Nie dotyczy"}</strong></div>
            <div class="data-item"><span>Wersje dokumentów</span><strong>REG-2026-09-23-01 · PP-2026-09-23-01</strong></div>
            <div class="data-item full"><span>Hash akceptacji</span><strong style="font-family:ui-monospace,monospace;font-size:11px">${escapeHTML(caseItem.consent.hash)}</strong></div>
          </div></div>
        </section>
      </div>`;
  }

  function renderCreditors(caseItem) {
    const total = caseItem.creditors.reduce((sum, item) => sum + item.amount, 0);
    return `
      <section class="card table-card">
        <div class="card-head"><div><h2>Wierzyciele i zobowiązania</h2><p class="section-copy">Lista z ankiety po weryfikacji operatora.</p></div><button class="button button-primary button-small" type="button" data-action="add-creditor" data-case-id="${caseItem.id}">${icon("plus")}Dodaj wierzyciela</button></div>
        <div class="card-body" style="padding-bottom:12px">
          <div class="creditor-summary">
            <div class="creditor-stat"><span>Liczba wierzycieli</span><strong>${caseItem.creditors.length}</strong></div>
            <div class="creditor-stat"><span>Łączne zadłużenie</span><strong>${money(total)}</strong></div>
            <div class="creditor-stat"><span>Kwoty sporne</span><strong>${money(caseItem.creditors.filter((item) => item.disputed).reduce((sum, item) => sum + item.amount, 0))}</strong></div>
          </div>
        </div>
        <div style="overflow-x:auto"><table class="data-table responsive-table">
          <thead><tr><th>Wierzyciel</th><th>Rodzaj zobowiązania</th><th>Kwota</th><th>Status</th><th></th></tr></thead>
          <tbody>${caseItem.creditors.map((creditor, index) => `
            <tr>
              <td class="primary-cell"><strong>${escapeHTML(creditor.name)}</strong><span>Pozycja ${index + 1}</span></td>
              <td data-label="Rodzaj">${escapeHTML(creditor.kind)}</td>
              <td data-label="Kwota"><strong>${money(creditor.amount)}</strong></td>
              <td data-label="Status">${creditor.disputed ? statusBadge("overdue", { overdue: "Kwota sporna" }) : statusBadge("complete", { complete: "Potwierdzono" })}</td>
              <td data-label="Działania"><button class="button button-secondary button-small" type="button" data-action="edit-creditor" data-case-id="${caseItem.id}" data-creditor-index="${index}">Edytuj</button></td>
            </tr>`).join("")}</tbody>
        </table></div>
        <div class="pagination-bar"><span>Razem: ${caseItem.creditors.length} pozycji</span><span>Kwoty mają charakter roboczy</span></div>
      </section>`;
  }

  function renderDocuments(caseItem) {
    const resolved = caseItem.documents.filter((item) => item.state !== "missing").length;
    const progress = Math.round((resolved / Math.max(1, caseItem.documents.length)) * 100);
    return `
      <div class="split-layout">
        <section class="card section-card">
          <div class="card-head"><div><h2>Lista wymaganych dokumentów</h2><p class="section-copy">Kliknij status po lewej, aby przejść między: brakuje, otrzymano i nie dotyczy.</p></div></div>
          <div class="card-body" style="padding-top:15px">
            <div class="progress-block"><div class="progress-row"><span>Kompletność</span><strong>${resolved}/${caseItem.documents.length} · ${progress}%</strong></div><div class="progress-bar"><span style="width:${progress}%"></span></div></div>
            <ul class="checklist" style="margin-top:12px">${checklist(caseItem)}</ul>
          </div>
          <div class="card-foot"><button class="button button-secondary button-small" type="button" data-action="send-reminder" data-case-id="${caseItem.id}">${icon("mail")}Wyślij przypomnienie o brakach</button></div>
        </section>
        <aside class="side-stack">
          <section class="card section-card">
            <div class="card-head"><div><h2>Załączniki</h2><p class="section-copy">${caseItem.attachments.length} plików w bezpiecznym magazynie.</p></div><button class="button button-primary button-small" type="button" data-action="upload-file" data-case-id="${caseItem.id}">${icon("plus")}Dodaj plik</button></div>
            <div>
              ${caseItem.attachments.length ? caseItem.attachments.map((file) => `
                <div class="document-item">
                  <span class="document-icon">${icon("file")}</span>
                  <span class="item-copy"><strong>${escapeHTML(file.name)}</strong><span>${escapeHTML(file.size)} · ${escapeHTML(file.date)}</span></span>
                  <button class="icon-button" type="button" data-action="mock-download" aria-label="Pobierz ${escapeHTML(file.name)}">${icon("download")}</button>
                </div>`).join("") : `<div class="empty-state"><span class="empty-state-icon">${icon("file")}</span><h2>Brak plików</h2><p>Nie dodano jeszcze załączników.</p></div>`}
            </div>
          </section>
          <div class="info-banner">${icon("shield")}<div><strong>Ochrona plików</strong>Załączniki nie są wysyłane w wiadomościach e-mail. Pozostają w prywatnym magazynie panelu.</div></div>
        </aside>
      </div>`;
  }

  function bankAccount(caseItem) {
    const key = `${caseItem.id}:bank`;
    const revealed = state.revealed.has(key);
    return `<div class="masked-value"><code>${revealed ? "PL 00 0000 0000 0000 0000 0000 0000 (DEMO)" : "PL 00 0000 •••• •••• •••• 0000"}</code><button class="reveal-button" type="button" data-action="reveal" data-case-id="${caseItem.id}" data-field="bank" title="${revealed ? "Ukryj" : "Pokaż"} numer rachunku">${icon("eye")}</button></div>`;
  }

  function renderOrder(caseItem) {
    return `
      <div class="main-stack">
        <div class="${caseItem.payment === "paid" ? "success-banner" : "warning-banner"}">${icon(caseItem.payment === "paid" ? "check" : "creditor")}<div><strong>${caseItem.payment === "paid" ? "Płatność potwierdzona" : "Płatność oczekuje na potwierdzenie"}</strong>${caseItem.payment === "paid" ? "Zamówienie może być realizowane zgodnie z ustalonym terminem." : "Po zaksięgowaniu przelewu oznacz płatność jako opłaconą."}</div></div>
        <div class="split-layout">
          <section class="card section-card">
            <div class="card-head"><div><h2>Dane zamówienia</h2><p class="section-copy">Warunki zapisane w chwili wysłania ankiety.</p></div>${statusBadge(caseItem.payment, PAYMENT_LABELS)}</div>
            <div class="card-body"><div class="data-grid">
              <div class="data-item full"><span>Usługa</span><strong>Przygotowanie projektu wniosku o ogłoszenie upadłości konsumenckiej</strong></div>
              <div class="data-item"><span>Cena zamówienia</span><strong>${money(caseItem.amount)}</strong><p>Zwolnienie z VAT</p></div>
              <div class="data-item"><span>Termin warunków</span><strong>${escapeHTML(caseItem.term)}</strong></div>
              <div class="data-item"><span>Data złożenia</span><strong>${escapeHTML(caseItem.createdAt)}</strong></div>
              <div class="data-item"><span>Wersja regulaminu</span><strong>REG-2026-09-23-01</strong></div>
              <div class="data-item"><span>Wersja polityki prywatności</span><strong>PP-2026-09-23-01</strong></div>
              <div class="data-item"><span>Wersja oświadczenia</span><strong>OSW-2026-09-23-01</strong></div>
            </div></div>
          </section>
          <aside class="side-stack">
            <section class="card section-card">
              <div class="card-head"><div><h2>Dane do przelewu</h2><p class="section-copy">Konfiguracja aktywna w systemie.</p></div></div>
              <div class="card-body"><div class="data-grid" style="grid-template-columns:1fr">
                <div class="data-item"><span>Odbiorca</span><strong>Mariusz Sztandera</strong></div>
                <div class="data-item"><span>Rachunek bankowy</span>${bankAccount(caseItem)}</div>
                <div class="data-item"><span>Tytuł przelewu</span><strong>${escapeHTML(caseItem.ref)} · ${escapeHTML(caseItem.name)}</strong></div>
              </div></div>
              ${caseItem.payment !== "paid" ? `<div class="card-foot"><button class="button button-primary button-small" type="button" data-action="mark-paid" data-case-id="${caseItem.id}">${icon("check")}Oznacz jako opłacone</button></div>` : ""}
            </section>
            <section class="card section-card">
              <div class="card-head"><div><h2>Wysyłka wiadomości</h2><p class="section-copy">Stan potwierdzeń po złożeniu zamówienia.</p></div></div>
              <div class="card-body">
                <div class="kpi-line"><span>E-mail do klienta</span><strong style="color:var(--success)">Wysłano</strong></div>
                <div class="kpi-line"><span>kontakt@example.invalid</span><strong style="color:var(--success)">Wysłano</strong></div>
                <div class="kpi-line"><span>kopia@example.invalid</span><strong style="color:var(--success)">Wysłano</strong></div>
              </div>
            </section>
          </aside>
        </div>
      </div>`;
  }

  function renderHistory(caseItem) {
    return `
      <div class="split-layout">
        <section class="card section-card">
          <div class="card-head"><div><h2>Historia biznesowa sprawy</h2><p class="section-copy">Czytelny przebieg obsługi klienta.</p></div><button class="button button-secondary button-small" type="button" data-action="add-note" data-case-id="${caseItem.id}">${icon("plus")}Dodaj notatkę</button></div>
          <div class="card-body"><ol class="timeline">${caseItem.history.map((event) => `
            <li class="timeline-item"><span class="timeline-dot"></span><span class="timeline-copy"><strong>${escapeHTML(event.title)}</strong><span>${escapeHTML(event.detail)}</span></span><time>${escapeHTML(event.at)}</time></li>`).join("")}</ol></div>
        </section>
        <aside class="side-stack">
          <div class="info-banner">${icon("history")}<div><strong>Historia sprawy a audyt</strong>Tu pokazujemy przebieg obsługi. Techniczne operacje i dostęp do danych chronionych są zapisywane osobno w dzienniku audytowym.</div></div>
          ${state.role === "admin" ? `<section class="card section-card"><div class="card-head"><div><h2>Operacje administracyjne</h2><p class="section-copy">Dostępne wyłącznie administratorowi.</p></div></div><div class="card-body"><button class="button button-danger" type="button" data-action="admin-correction" data-case-id="${caseItem.id}">Wprowadź korektę administracyjną</button></div></section>` : ""}
        </aside>
      </div>`;
  }

  function renderCase(caseId, requestedTab) {
    const caseItem = getCase(caseId);
    if (!caseItem) {
      renderNotFound("Nie znaleziono sprawy", "Ta sprawa nie istnieje w zestawie demonstracyjnym.");
      return;
    }
    const tab = CASE_TABS.some(([id]) => id === requestedTab) ? requestedTab : "overview";
    const tabLabel = CASE_TABS.find(([id]) => id === tab)?.[1] || "Przebieg";
    setBreadcrumbs([{ label: "Sprawy", href: "#cases" }, { label: caseItem.name }, { label: tabLabel }]);
    let content = "";
    if (tab === "overview") content = renderOverview(caseItem);
    if (tab === "questionnaire") content = renderQuestionnaire(caseItem);
    if (tab === "creditors") content = renderCreditors(caseItem);
    if (tab === "documents") content = renderDocuments(caseItem);
    if (tab === "order") content = renderOrder(caseItem);
    if (tab === "history") content = renderHistory(caseItem);

    dom.root.innerHTML = `
      <section class="page">
        ${caseHero(caseItem)}
        <section class="next-action-card">
          <div class="next-action-main"><span class="next-action-icon">${icon("arrow")}</span><span class="next-action-copy"><span>Następne działanie</span><strong>${escapeHTML(caseItem.nextAction)}</strong><small style="display:block;color:var(--ink-600);margin-top:2px">${escapeHTML(caseItem.nextActionDue)}</small></span></div>
          ${caseItem.status !== "completed" ? `<button class="button button-primary button-small" type="button" data-action="complete-next" data-case-id="${caseItem.id}">${icon("check")}Oznacz jako wykonane</button>` : ""}
        </section>
        ${caseStage(caseItem)}
        ${caseTabs(caseItem, tab)}
        <div class="case-tab-content">${content}</div>
      </section>`;
  }

  function renderInvitations() {
    setBreadcrumbs([{ label: "Linki do ankiety" }]);
    dom.root.innerHTML = `
      <section class="page">
        ${pageHead({
          eyebrow: "Pozyskanie danych",
          title: "Linki do ankiety",
          subtitle: "Twórz bezpieczne, jednorazowe zaproszenia dla klientów.",
          actions: `<button class="button button-primary" type="button" data-action="new-invitation">${icon("plus")}Utwórz link</button>`
        })}
        <div class="info-banner">${icon("shield")}<div><strong>Link jest jednorazowy</strong>Po poprawnym wysłaniu ankiety token zostaje wykorzystany. Nie wysyłaj linków przez kanały dostępne osobom postronnym.</div></div>
        <section class="card table-card">
          <div style="overflow-x:auto"><table class="data-table responsive-table">
            <thead><tr><th>Odbiorca</th><th>Utworzono</th><th>Wygasa</th><th>Status</th><th>Działania</th></tr></thead>
            <tbody>${state.invitations.map((item) => `
              <tr>
                <td class="primary-cell"><strong>${escapeHTML(item.recipient)}</strong><span>${escapeHTML(item.email)} · ${escapeHTML(item.id)}</span></td>
                <td data-label="Utworzono">${escapeHTML(item.created)}</td>
                <td data-label="Wygasa">${escapeHTML(item.expires)}</td>
                <td data-label="Status">${item.status === "active" ? statusBadge("active", { active: "Aktywny" }) : statusBadge("neutral", { neutral: "Wygasł" })}</td>
                <td data-label="Działania"><div class="row-actions"><button class="button button-secondary button-small" type="button" data-action="copy-invitation" data-invitation-id="${item.id}" ${item.status !== "active" ? "disabled" : ""}>Kopiuj link</button><button class="button button-quiet button-small" type="button" data-action="send-invitation" data-invitation-id="${item.id}" ${item.status !== "active" ? "disabled" : ""}>Wyślij</button></div></td>
              </tr>`).join("")}</tbody>
          </table></div>
          <div class="pagination-bar"><span>${state.invitations.filter((item) => item.status === "active").length} aktywne linki</span><span>Domyślna ważność: 7 dni</span></div>
        </section>
      </section>`;
  }

  function renderArchive() {
    setBreadcrumbs([{ label: "Archiwum" }]);
    const archived = state.cases.filter((item) => item.status === "completed");
    dom.root.innerHTML = `
      <section class="page">
        ${pageHead({ eyebrow: "Zakończone sprawy", title: "Archiwum", subtitle: "Sprawy zamknięte i oczekujące na końcową archiwizację danych." })}
        <section class="card table-card">
          <div class="table-tools"><div class="table-tools-left"><label class="search-field">${icon("search")}<input class="field" type="search" placeholder="Szukaj w archiwum"></label></div></div>
          <div style="overflow-x:auto"><table class="data-table responsive-table">
            <thead><tr><th>Klient i numer sprawy</th><th>Zamknięto</th><th>Sposób zamknięcia</th><th>Archiwizacja</th><th></th></tr></thead>
            <tbody>${archived.map((item) => `
              <tr class="clickable" data-action="open-case" data-case-id="${item.id}">
                <td class="primary-cell"><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.ref)}</span></td>
                <td data-label="Zamknięto">15 wrz 2026</td>
                <td data-label="Sposób">Usługa zrealizowana</td>
                <td data-label="Archiwizacja">${statusBadge("scheduled", { scheduled: "Zaplanowana: 3 gru" })}</td>
                <td data-label="Działania"><button class="button button-secondary button-small" type="button">Otwórz</button></td>
              </tr>`).join("")}</tbody>
          </table></div>
        </section>
      </section>`;
  }

  function adminHeader(title, subtitle, eyebrow = "Administracja") {
    return pageHead({ eyebrow, title, subtitle });
  }

  function renderRetention() {
    setBreadcrumbs([{ label: "Administracja" }, { label: "Retencja danych" }]);
    dom.root.innerHTML = `
      <section class="page">
        ${adminHeader("Retencja danych", "Kontroluj terminy przechowywania, blokady i planowane usunięcia.")}
        <div class="warning-banner">${icon("shield")}<div><strong>Automatyczne usuwanie pozostaje wyłączone</strong>Panel tylko raportuje terminy. Ostateczne usunięcie wymaga potwierdzenia administratora i jest odnotowywane w audycie.</div></div>
        <div class="metric-grid">
          ${metricCard("Sprawy objęte retencją", "6", "Wszystkie rekordy mają regułę", "archive")}
          ${metricCard("Do przeglądu w 30 dni", "1", "Wymaga decyzji administratora", "history", "var(--warning)", "var(--warning-bg)")}
          ${metricCard("Blokady retencji", "0", "Brak aktywnych wyjątków", "lock", "var(--success)", "var(--success-bg)")}
          ${metricCard("Błędy archiwizacji", "0", "Ostatnie 30 dni", "shield", "var(--success)", "var(--success-bg)")}
        </div>
        <section class="card table-card">
          <div class="card-head"><div><h2>Harmonogram retencji</h2><p class="section-copy">Najbliższe terminy przeglądu danych.</p></div><button class="button button-secondary button-small" type="button" data-action="export-report">${icon("download")}Eksportuj raport</button></div>
          <div style="overflow-x:auto"><table class="data-table responsive-table"><thead><tr><th>Sprawa</th><th>Zamknięcie</th><th>Planowana archiwizacja</th><th>Blokada</th><th>Status</th></tr></thead><tbody>
            <tr><td class="primary-cell"><strong>Jan Archiwalny</strong><span>PU-DEMO-E24F19</span></td><td data-label="Zamknięcie">15 wrz 2026</td><td data-label="Archiwizacja">3 gru 2026</td><td data-label="Blokada">Nie</td><td data-label="Status">${statusBadge("scheduled", { scheduled: "Zaplanowana" })}</td></tr>
          </tbody></table></div>
        </section>
      </section>`;
  }

  function renderBackups() {
    setBreadcrumbs([{ label: "Administracja" }, { label: "Kopie zapasowe" }]);
    dom.root.innerHTML = `
      <section class="page">
        ${pageHead({ eyebrow: "Bezpieczeństwo danych", title: "Kopie zapasowe", subtitle: "Stan automatycznych kopii bazy i załączników.", actions: `<button class="button button-primary" type="button" data-action="create-backup">${icon("database")}Utwórz kopię teraz</button>` })}
        <div class="success-banner">${icon("check")}<div><strong>Ostatnia kopia zakończyła się prawidłowo</strong>Baza danych i indeks załączników zostały zapisane dzisiaj o 02:00.</div></div>
        <div class="metric-grid">
          ${metricCard("Ostatnia kopia", "02:00", "Dzisiaj · wynik prawidłowy", "database", "var(--success)", "var(--success-bg)")}
          ${metricCard("Rozmiar bazy", "18,4 MB", "6 spraw w prototypie", "database")}
          ${metricCard("Załączniki", "21,7 MB", "7 plików demonstracyjnych", "file", "var(--purple)", "var(--purple-bg)")}
          ${metricCard("Okres przechowywania", "30 dni", "Codzienna rotacja kopii", "history")}
        </div>
        <section class="card table-card"><div class="card-head"><div><h2>Historia kopii</h2><p class="section-copy">Ostatnie operacje zabezpieczenia danych.</p></div></div><div style="overflow-x:auto"><table class="data-table responsive-table"><thead><tr><th>Data</th><th>Zakres</th><th>Rozmiar</th><th>Integralność</th><th>Status</th></tr></thead><tbody>
          ${[
            ["23 wrz 2026, 02:00", "Baza + indeks plików", "18,4 MB", "Zweryfikowana"],
            ["22 wrz 2026, 02:00", "Baza + indeks plików", "18,1 MB", "Zweryfikowana"],
            ["21 wrz 2026, 02:00", "Baza + indeks plików", "17,8 MB", "Zweryfikowana"]
          ].map((row) => `<tr><td class="primary-cell"><strong>${row[0]}</strong><span>Automatyczna</span></td><td data-label="Zakres">${row[1]}</td><td data-label="Rozmiar">${row[2]}</td><td data-label="Integralność">${row[3]}</td><td data-label="Status">${statusBadge("complete", { complete: "Gotowa" })}</td></tr>`).join("")}
        </tbody></table></div></section>
      </section>`;
  }

  function renderAudit() {
    setBreadcrumbs([{ label: "Administracja" }, { label: "Dziennik audytowy" }]);
    dom.root.innerHTML = `
      <section class="page">
        ${pageHead({ eyebrow: "Kontrola dostępu", title: "Dziennik audytowy", subtitle: "Niezmienny rejestr działań, dostępu do danych chronionych i operacji administratora.", actions: `<button class="button button-secondary" type="button" data-action="export-audit">${icon("download")}Eksportuj CSV</button>` })}
        <section class="card">
          <div class="table-tools"><div class="table-tools-left"><label class="search-field">${icon("search")}<input class="field" type="search" placeholder="Szukaj zdarzenia, osoby lub sprawy"></label><select class="select-field"><option>Wszystkie typy zdarzeń</option><option>Dostęp do danych</option><option>Zmiana rekordu</option><option>Logowanie</option></select></div></div>
          <div>${state.audit.map((event) => `<div class="audit-event"><time>${escapeHTML(event.at)}</time><div><strong>${escapeHTML(event.action)}</strong><span>${escapeHTML(event.detail)}</span></div><div class="audit-actor">${escapeHTML(event.actor)}</div></div>`).join("")}</div>
          <div class="pagination-bar"><span>${state.audit.length} zdarzeń w widoku demonstracyjnym</span><span>Rejestr tylko do odczytu</span></div>
        </section>
      </section>`;
  }

  function renderUsers() {
    setBreadcrumbs([{ label: "Administracja" }, { label: "Użytkownicy" }]);
    dom.root.innerHTML = `
      <section class="page">
        ${pageHead({ eyebrow: "Role i dostęp", title: "Użytkownicy", subtitle: "Dostęp do panelu jest nadawany przez Cloudflare Access i dodatkowo ograniczany rolą w aplikacji.", actions: `<button class="button button-primary" type="button" data-action="add-user">${icon("plus")}Dodaj użytkownika</button>` })}
        <div class="info-banner">${icon("shield")}<div><strong>Logowanie z MFA</strong>Panel nie przechowuje haseł. Tożsamość jest potwierdzana przez Cloudflare Access, a uprawnienia są sprawdzane przez prywatny Worker.</div></div>
        <section class="card">
          <div class="user-row"><div class="user-profile"><span class="avatar">MS</span><div><strong>Mariusz Sztandera</strong><span>administrator@example.invalid</span></div></div><div>${statusBadge("active", { active: "Administrator" })}</div><div><strong style="display:block;font-size:12px">Dzisiaj, 09:14</strong><span style="color:var(--ink-500);font-size:10.5px">Ostatnia aktywność</span></div><button class="button button-secondary button-small" type="button" data-action="edit-user">Edytuj</button></div>
          <div class="user-row"><div class="user-profile"><span class="avatar" style="background:linear-gradient(135deg,#8b5cf6,#633bc1)">AK</span><div><strong>Ania Kowalska</strong><span>operator@example.invalid</span></div></div><div>${statusBadge("contacted", { contacted: "Operator" })}</div><div><strong style="display:block;font-size:12px">Dzisiaj, 09:02</strong><span style="color:var(--ink-500);font-size:10.5px">Ostatnia aktywność</span></div><button class="button button-secondary button-small" type="button" data-action="edit-user">Edytuj</button></div>
        </section>
        <section class="card section-card"><div class="card-head"><div><h2>Zakres ról</h2><p class="section-copy">Podstawowa matryca uprawnień.</p></div></div><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Obszar</th><th>Operator</th><th>Administrator</th></tr></thead><tbody>
          ${[
            ["Sprawy, ankiety, dokumenty i zadania", "Pełna obsługa", "Pełna obsługa"],
            ["Płatności i kontakt z klientem", "Obsługa", "Obsługa i korekty"],
            ["Retencja, kopie i audyt", "Brak dostępu", "Pełny dostęp"],
            ["Użytkownicy i konfiguracja", "Brak dostępu", "Pełny dostęp"],
            ["Trwałe usuwanie danych", "Brak dostępu", "Podwójne potwierdzenie"]
          ].map((row) => `<tr><td><strong>${row[0]}</strong></td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("")}
        </tbody></table></div></section>
      </section>`;
  }

  function renderSettings() {
    setBreadcrumbs([{ label: "Administracja" }, { label: "Konfiguracja" }]);
    dom.root.innerHTML = `
      <section class="page">
        ${pageHead({ eyebrow: "Ustawienia systemu", title: "Konfiguracja", subtitle: "Najważniejsze parametry biznesowe, bezpieczeństwa i wysyłki.", actions: `<button class="button button-primary" type="button" data-action="save-settings">${icon("check")}Zapisz zmiany</button>` })}
        <section class="card section-card">
          <div class="card-head"><div><h2>Bezpieczeństwo i sesje</h2><p class="section-copy">Tożsamość weryfikowana przed każdym dostępem do prywatnego Workera.</p></div></div>
          <div class="card-body"><div class="settings-grid">
            <div class="setting-tile"><span>Logowanie</span><strong>Cloudflare Access + MFA</strong><p>Brak tokenu administratora w przeglądarce.</p><span class="setting-state">${statusBadge("active", { active: "Aktywne" })}</span></div>
            <div class="setting-tile"><span>Czas sesji</span><strong>12 godzin</strong><p>Odświeżenie strony nie kończy sesji.</p></div>
            <div class="setting-tile"><span>Wylogowanie</span><strong>Jawny przycisk w profilu</strong><p>Kończy sesję Access na urządzeniu.</p></div>
            <div class="setting-tile"><span>Dostęp do danych chronionych</span><strong>Rejestrowany w audycie</strong><p>PESEL, adres, dokument i konto bankowe.</p></div>
          </div></div>
        </section>
        <section class="card section-card">
          <div class="card-head"><div><h2>Zamówienie i płatności</h2><p class="section-copy">Dane wykorzystywane w instrukcjach dla klienta.</p></div></div>
          <div class="card-body"><div class="settings-grid">
            <div class="setting-tile"><span>Cena usługi</span><strong>2 000,00 zł</strong><p>Zwolnienie z VAT</p></div>
            <div class="setting-tile"><span>Odbiorca płatności</span><strong>Mariusz Sztandera</strong></div>
            <div class="setting-tile full"><span>Rachunek firmowy</span><strong>PL 00 0000 0000 0000 0000 0000 0000 (DEMO)</strong></div>
          </div></div>
        </section>
        <section class="card section-card">
          <div class="card-head"><div><h2>Powiadomienia e-mail</h2><p class="section-copy">Minimalny zakres informacji — pełne dane pozostają w panelu.</p></div></div>
          <div class="card-body"><div class="settings-grid">
            <div class="setting-tile"><span>Adres główny</span><strong>kontakt@example.invalid</strong><span class="setting-state">${statusBadge("active", { active: "Aktywny" })}</span></div>
            <div class="setting-tile"><span>Kopia powiadomień</span><strong>kopia@example.invalid</strong><span class="setting-state">${statusBadge("active", { active: "Aktywny" })}</span></div>
            <div class="setting-tile full"><span>Dostawca wysyłki</span><strong>Resend</strong><p>Ostatnia próba: poprawna · oba adresy przyjęte do wysyłki.</p></div>
          </div></div>
        </section>
        <section class="card section-card">
          <div class="card-head"><div><h2>Automatyzacje</h2><p class="section-copy">Ustawienia, które nie wymagają ręcznej obsługi każdej sprawy.</p></div></div>
          <div class="card-body"><div class="settings-grid">
            <div class="setting-tile"><span>Codzienna kopia zapasowa</span><strong>02:00</strong><label class="toggle setting-state"><input type="checkbox" checked><span></span></label></div>
            <div class="setting-tile"><span>Przypomnienia o zadaniach</span><strong>08:00 w dni robocze</strong><label class="toggle setting-state"><input type="checkbox" checked><span></span></label></div>
            <div class="setting-tile"><span>Raport retencji</span><strong>Pierwszy dzień miesiąca</strong><label class="toggle setting-state"><input type="checkbox" checked><span></span></label></div>
            <div class="setting-tile"><span>Automatyczne usuwanie</span><strong>Wyłączone</strong><label class="toggle setting-state"><input type="checkbox"><span></span></label></div>
          </div></div>
        </section>
      </section>`;
  }

  function renderNotFound(title = "Nie znaleziono strony", detail = "Wybierz inną sekcję z menu panelu.") {
    setBreadcrumbs([{ label: "Błąd" }]);
    dom.root.innerHTML = `<section class="page"><div class="card empty-state"><span class="empty-state-icon">${icon("search")}</span><h1>${escapeHTML(title)}</h1><p>${escapeHTML(detail)}</p><a class="button button-primary" href="#dashboard">Wróć do pulpitu</a></div></section>`;
  }

  function render() {
    const route = getRoute();
    if (state.role === "operator" && ADMIN_ROUTES.has(route.name)) {
      navigate("#dashboard");
      toast("Brak dostępu", "Ta sekcja jest dostępna wyłącznie dla administratora.", "warning");
      return;
    }
    updateChrome(route);
    if (route.name === "dashboard") renderDashboard();
    else if (route.name === "cases") renderCases();
    else if (route.name === "case") renderCase(route.id, route.tab);
    else if (route.name === "invitations") renderInvitations();
    else if (route.name === "archive") renderArchive();
    else if (route.name === "retention") renderRetention();
    else if (route.name === "backups") renderBackups();
    else if (route.name === "audit") renderAudit();
    else if (route.name === "users") renderUsers();
    else if (route.name === "settings") renderSettings();
    else renderNotFound();
    dom.body.classList.remove("sidebar-open");
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }));
  }

  function newInvitationModal() {
    openModal({
      title: "Utwórz link do ankiety",
      eyebrow: "Jednorazowe zaproszenie",
      confirm: "Utwórz bezpieczny link",
      body: `
        <div class="form-grid">
          <label class="form-label">Imię i nazwisko klienta<input class="field" name="recipient" required placeholder="np. Jan Kowalski"></label>
          <label class="form-label">Adres e-mail<input class="field" name="email" type="email" required placeholder="klient@example.com"></label>
          <label class="form-label">Ważność linku<select class="field" name="validity"><option value="7">7 dni</option><option value="3">3 dni</option><option value="1">24 godziny</option></select></label>
          <label class="form-label">Prowadzący<select class="field" name="owner"><option>Ania Kowalska</option><option>Mariusz Sztandera</option><option>Nie przypisuj</option></select></label>
        </div>
        <div class="info-banner" style="margin-top:15px">${icon("shield")}<div>To prototyp. Powstanie fikcyjny wpis i przykładowy link, ale żadna wiadomość nie zostanie wysłana.</div></div>`,
      handler: (formData) => {
        const recipient = String(formData.get("recipient") || "").trim();
        const email = String(formData.get("email") || "").trim();
        if (!recipient || !email) {
          toast("Uzupełnij dane", "Imię i adres e-mail są wymagane.", "warning");
          return false;
        }
        const id = `INV-DEMO-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
        state.invitations.unshift({ id, recipient, email, created: "23 wrz 2026, przed chwilą", expires: "30 wrz 2026", status: "active" });
        addAudit("Utworzono link do ankiety", `${id} · ${recipient}`);
        toast("Link demonstracyjny utworzony", "Możesz go skopiować z listy. Nie prowadzi do produkcyjnej ankiety.", "success");
        navigate("#invitations");
        return true;
      }
    });
  }

  function addTaskModal(caseItem) {
    openModal({
      title: "Dodaj zadanie",
      confirm: "Dodaj zadanie",
      body: `<div class="form-grid"><label class="form-label full-width">Treść zadania<input class="field" name="title" required placeholder="Co należy zrobić?"></label><label class="form-label">Termin<input class="field" name="due" value="Jutro, 12:00"></label><label class="form-label">Priorytet<select class="field" name="priority"><option value="normal">Standard</option><option value="high">Pilne</option><option value="low">Niski</option></select></label></div>`,
      handler: (data) => {
        const title = String(data.get("title") || "").trim();
        if (!title) return false;
        caseItem.tasks.unshift({ id: `t${Date.now()}`, title, due: String(data.get("due") || "Bez terminu"), priority: String(data.get("priority") || "normal"), done: false });
        addAudit("Dodano zadanie", `${caseItem.ref} · ${title}`);
        toast("Zadanie dodane", "Zmiana dotyczy wyłącznie prototypu.", "success");
        render();
        return true;
      }
    });
  }

  function addNoteModal(caseItem) {
    openModal({
      title: "Dodaj notatkę wewnętrzną",
      confirm: "Zapisz notatkę",
      body: `<label class="form-label">Treść notatki<textarea class="textarea-field" name="text" required placeholder="Zapisz ustalenia z klientem lub informację dla zespołu."></textarea></label><div class="info-banner" style="margin-top:14px">${icon("lock")}<div>Notatka będzie widoczna wyłącznie dla użytkowników panelu.</div></div>`,
      handler: (data) => {
        const text = String(data.get("text") || "").trim();
        if (!text) return false;
        const author = state.role === "admin" ? "Mariusz Sztandera" : "Ania Kowalska";
        caseItem.notes.unshift({ author, at: "przed chwilą", text });
        caseItem.history.unshift({ title: "Dodano notatkę do sprawy", detail: author, at: "przed chwilą" });
        addAudit("Dodano notatkę", caseItem.ref);
        toast("Notatka zapisana", "Zmiana dotyczy wyłącznie prototypu.", "success");
        render();
        return true;
      }
    });
  }

  function creditorModal(caseItem, creditorIndex = null) {
    const creditor = creditorIndex === null ? null : caseItem.creditors[creditorIndex];
    openModal({
      title: creditor ? "Edytuj wierzyciela" : "Dodaj wierzyciela",
      confirm: creditor ? "Zapisz zmiany" : "Dodaj pozycję",
      body: `<div class="form-grid"><label class="form-label full-width">Nazwa wierzyciela<input class="field" name="name" required value="${escapeHTML(creditor?.name || "")}" placeholder="Pełna nazwa"></label><label class="form-label">Rodzaj zobowiązania<input class="field" name="kind" value="${escapeHTML(creditor?.kind || "")}" placeholder="np. kredyt gotówkowy"></label><label class="form-label">Kwota w zł<input class="field" name="amount" type="number" min="0" step="0.01" value="${creditor?.amount || ""}"></label><label class="form-label full-width" style="display:flex;grid-template-columns:auto 1fr;align-items:center"><input name="disputed" type="checkbox" ${creditor?.disputed ? "checked" : ""}>Kwota lub istnienie zobowiązania są sporne</label></div>`,
      handler: (data) => {
        const name = String(data.get("name") || "").trim();
        if (!name) return false;
        const next = { name, kind: String(data.get("kind") || "Inne"), amount: Number(data.get("amount")) || 0, disputed: data.get("disputed") === "on" };
        if (creditor) caseItem.creditors[creditorIndex] = next;
        else caseItem.creditors.push(next);
        addAudit(creditor ? "Zmieniono wierzyciela" : "Dodano wierzyciela", `${caseItem.ref} · ${name}`);
        toast(creditor ? "Zmiany zapisane" : "Wierzyciel dodany", "Zmiana dotyczy wyłącznie prototypu.", "success");
        render();
        return true;
      }
    });
  }

  function genericDemoAction(title, detail, confirm = "Potwierdź") {
    openModal({
      title,
      confirm,
      body: `<div class="info-banner">${icon("shield")}<div><strong>Tryb demonstracyjny</strong>${escapeHTML(detail)} Operacja nie zostanie wykonana w systemie produkcyjnym.</div></div>`,
      handler: () => {
        toast("Działanie zasymulowane", "Produkcja i prawdziwe dane pozostały bez zmian.", "success");
        return true;
      }
    });
  }

  function handleAction(button) {
    const action = button.dataset.action;
    const caseItem = button.dataset.caseId ? getCase(button.dataset.caseId) : null;
    if (action === "open-case") navigate(`#case/${button.dataset.caseId}/overview`);
    else if (action === "notification-case") {
      dom.notificationPanel.hidden = true;
      navigate(`#case/${button.dataset.caseId}/overview`);
    } else if (action === "new-invitation") newInvitationModal();
    else if (action === "toggle-task" && caseItem) {
      const task = caseItem.tasks.find((item) => item.id === button.dataset.taskId);
      if (task) {
        task.done = !task.done;
        addAudit(task.done ? "Ukończono zadanie" : "Przywrócono zadanie", `${caseItem.ref} · ${task.title}`);
        toast(task.done ? "Zadanie wykonane" : "Zadanie przywrócone", "Zmiana została zapisana tylko w prototypie.", "success");
        render();
      }
    } else if (action === "cycle-document" && caseItem) {
      const documentItem = caseItem.documents.find((item) => item.id === button.dataset.documentId);
      if (documentItem) {
        const order = ["missing", "received", "not_applicable"];
        documentItem.state = order[(order.indexOf(documentItem.state) + 1) % order.length];
        const received = caseItem.documents.filter((item) => item.state === "received").length;
        const unresolved = caseItem.documents.filter((item) => item.state === "missing").length;
        caseItem.materials = unresolved === 0 ? "complete" : received ? "incomplete" : "not_verified";
        addAudit("Zmieniono status dokumentu", `${caseItem.ref} · ${documentItem.name}: ${CHECK_LABELS[documentItem.state]}`);
        render();
      }
    } else if (action === "add-task" && caseItem) addTaskModal(caseItem);
    else if (action === "add-note" && caseItem) addNoteModal(caseItem);
    else if (action === "add-creditor" && caseItem) creditorModal(caseItem);
    else if (action === "edit-creditor" && caseItem) creditorModal(caseItem, Number(button.dataset.creditorIndex));
    else if (action === "reveal" && caseItem) {
      const key = `${caseItem.id}:${button.dataset.field}`;
      const willReveal = !state.revealed.has(key);
      if (willReveal) {
        state.revealed.add(key);
        addAudit("Wyświetlono dane chronione", `${caseItem.ref} · pole: ${button.dataset.field}`);
        toast("Dostęp odnotowany", "Wyświetlenie danych chronionych zapisano w audycie.");
      } else state.revealed.delete(key);
      render();
    } else if (action === "mark-paid" && caseItem) {
      openModal({
        title: "Potwierdź otrzymanie płatności",
        confirm: "Oznacz jako opłacone",
        body: `<div class="summary-grid"><div class="summary-item"><span>Klient</span><strong>${escapeHTML(caseItem.name)}</strong></div><div class="summary-item"><span>Kwota</span><strong>${money(caseItem.amount)}</strong></div><div class="summary-item full"><span>Numer sprawy</span><strong>${escapeHTML(caseItem.ref)}</strong></div></div><div class="warning-banner" style="margin-top:14px">${icon("creditor")}<div>W wersji docelowej tę operację należy wykonać dopiero po sprawdzeniu rachunku bankowego.</div></div>`,
        handler: () => {
          caseItem.payment = "paid";
          caseItem.history.unshift({ title: "Płatność została potwierdzona", detail: `${money(caseItem.amount)} · prototyp`, at: "przed chwilą" });
          addAudit("Potwierdzono płatność", `${caseItem.ref} · ${money(caseItem.amount)}`);
          toast("Płatność oznaczona jako opłacona", "Zmiana dotyczy wyłącznie prototypu.", "success");
          render();
          return true;
        }
      });
    } else if (action === "complete-next" && caseItem) {
      const firstOpen = caseItem.tasks.find((task) => !task.done);
      if (firstOpen) firstOpen.done = true;
      addAudit("Wykonano następne działanie", `${caseItem.ref} · ${caseItem.nextAction}`);
      caseItem.nextAction = caseItem.tasks.find((task) => !task.done)?.title || "Ustal kolejne działanie";
      caseItem.nextActionDue = caseItem.tasks.find((task) => !task.done)?.due || "Bez terminu";
      toast("Działanie wykonane", "Panel wyznaczył kolejne zadanie na podstawie listy.", "success");
      render();
    } else if (action === "contact" && caseItem) {
      genericDemoAction(button.dataset.channel === "phone" ? `Rozmowa z: ${caseItem.name}` : `Wiadomość do: ${caseItem.name}`, button.dataset.channel === "phone" ? `Panel otworzy numer ${caseItem.phone}.` : `Panel przygotuje wiadomość na ${caseItem.email}.`, button.dataset.channel === "phone" ? "Rozpocznij" : "Przygotuj wiadomość");
    } else if (action === "copy-invitation") {
      const value = `https://example.invalid/ankieta.html?token=DEMO-${button.dataset.invitationId}`;
      navigator.clipboard?.writeText(value).catch(() => {});
      toast("Link demonstracyjny skopiowany", "Nie prowadzi do formularza produkcyjnego.", "success");
    } else if (action === "send-invitation") genericDemoAction("Wyślij zaproszenie", "Panel wyśle klientowi bezpieczny link do ankiety.", "Wyślij");
    else if (action === "mock-save" || action === "save-settings") {
      toast("Zmiany zapisane w prototypie", "Nie wysłano żadnych danych do produkcji.", "success");
      addAudit("Zapisano ustawienia demonstracyjne", "Prototyp Panelu 2.0");
    } else if (action === "send-reminder") genericDemoAction("Wyślij przypomnienie", "Panel przygotuje wiadomość zawierającą wyłącznie listę brakujących dokumentów.", "Wyślij przypomnienie");
    else if (action === "upload-file") genericDemoAction("Dodaj bezpieczny załącznik", "Plik zostanie zaszyfrowany i zapisany w prywatnym magazynie R2.", "Wybierz plik");
    else if (action === "mock-download") toast("Pobieranie zasymulowane", "W prototypie nie ma prawdziwego załącznika.");
    else if (action === "case-menu") genericDemoAction("Pozostałe działania", "W finalnym panelu znajdą się tu: zmiana prowadzącego, eksport sprawy i zamknięcie sprawy.", "Rozumiem");
    else if (action === "admin-correction") genericDemoAction("Korekta administracyjna", "Każda korekta wymaga podania przyczyny i pozostawia trwały wpis w audycie.", "Przejdź dalej");
    else if (["export-report", "export-audit"].includes(action)) toast("Eksport przygotowany", "W prototypie plik nie zawiera prawdziwych danych.", "success");
    else if (action === "create-backup") genericDemoAction("Utwórz kopię zapasową", "Panel uruchomi kopię bazy i indeksu załączników.", "Utwórz kopię");
    else if (["add-user", "edit-user"].includes(action)) genericDemoAction(action === "add-user" ? "Dodaj użytkownika" : "Edytuj użytkownika", "Uprawnienia zostaną powiązane z tożsamością zweryfikowaną przez Cloudflare Access.", "Zapisz");
    else if (action === "profile") {
      dom.userPopover.hidden = true;
      genericDemoAction("Moje konto", "Dane profilu i ustawienia sesji będą zarządzane przez bezpieczny moduł tożsamości.", "Zamknij");
    } else if (action === "logout") {
      dom.userPopover.hidden = true;
      genericDemoAction("Wyloguj z panelu", "W wersji docelowej zakończy to sesję Cloudflare Access na tym urządzeniu.", "Wyloguj");
    }
  }

  dom.modalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const submitter = event.submitter;
    if (submitter?.value === "cancel") {
      closeModal();
      return;
    }
    const handler = state.modalHandler;
    if (!handler) {
      closeModal();
      return;
    }
    const result = handler(new FormData(dom.modalForm));
    if (result !== false) closeModal();
  });

  dom.root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (!action) return;
    if (action.tagName === "TR" && event.target.closest("button, a, input, select")) return;
    event.preventDefault();
    handleAction(action);
  });

  dom.root.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("tr[data-action='open-case']")) {
      event.preventDefault();
      handleAction(event.target);
    }
  });

  dom.root.addEventListener("input", (event) => {
    if (event.target.id === "case-search") {
      state.caseSearch = event.target.value;
      const position = event.target.selectionStart;
      renderCases();
      const input = document.getElementById("case-search");
      input?.focus();
      input?.setSelectionRange(position, position);
    }
  });

  dom.root.addEventListener("change", (event) => {
    if (event.target.id === "case-status") {
      state.caseStatus = event.target.value;
      renderCases();
    }
    if (event.target.id === "case-sort") {
      state.caseSort = event.target.value;
      renderCases();
    }
  });

  dom.rolePreview.addEventListener("change", () => {
    state.role = dom.rolePreview.value;
    const label = state.role === "admin" ? "administratora" : "operatora";
    toast("Zmieniono podgląd roli", `Wyświetlasz teraz panel ${label}.`, "success");
    render();
  });

  dom.menuButton.addEventListener("click", () => dom.body.classList.add("sidebar-open"));
  dom.sidebarClose.addEventListener("click", () => dom.body.classList.remove("sidebar-open"));
  dom.sidebarScrim.addEventListener("click", () => dom.body.classList.remove("sidebar-open"));

  dom.userMenuButton.addEventListener("click", () => {
    const next = dom.userPopover.hidden;
    dom.userPopover.hidden = !next;
    dom.userMenuButton.setAttribute("aria-expanded", String(next));
  });

  dom.userPopover.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (action) handleAction(action);
  });

  dom.notificationsButton.addEventListener("click", () => {
    dom.notificationPanel.hidden = !dom.notificationPanel.hidden;
    dom.userPopover.hidden = true;
    state.notificationRead = true;
    dom.notificationsButton.querySelector(".notification-dot")?.remove();
  });

  dom.notificationsClose.addEventListener("click", () => {
    dom.notificationPanel.hidden = true;
  });

  dom.notificationList.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (action) handleAction(action);
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.getAttribute("href") === "#main-content") return;
    event.preventDefault();
    navigate(link.getAttribute("href"));
  });

  document.addEventListener("click", (event) => {
    if (!dom.userPopover.hidden && !dom.userPopover.contains(event.target) && !dom.userMenuButton.contains(event.target)) {
      dom.userPopover.hidden = true;
      dom.userMenuButton.setAttribute("aria-expanded", "false");
    }
    if (!dom.notificationPanel.hidden && !dom.notificationPanel.contains(event.target) && !dom.notificationsButton.contains(event.target)) {
      dom.notificationPanel.hidden = true;
    }
  });

  window.addEventListener("hashchange", render);
  if (!window.location.hash) window.location.hash = "#dashboard";
  else render();
})();
