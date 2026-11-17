import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const root = new URL("../../", import.meta.url);
const html = await readFile(new URL("panel-v2/index.html", root), "utf8");
const script = await readFile(new URL("panel-v2/assets/panel.js", root), "utf8");

async function openPanel(fetchImpl, url = "https://panel.pogotowieupadlosciowe.pl/") {
  const dom = new JSDOM(html, {
    url,
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  dom.window.fetch = fetchImpl;
  dom.window.Headers = Headers;
  dom.window.AbortController = AbortController;
  dom.window.eval(script);
  await new Promise((resolve) => setTimeout(resolve, 15));
  return dom;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

test("bez potwierdzonej sesji panel nie pokazuje fikcyjnych spraw", async () => {
  const dom = await openPanel(async () => json({ error: "Unauthorized" }, 401));
  const { document } = dom.window;
  assert.equal(document.body.classList.contains("mode-live"), true);
  assert.equal(document.querySelector("#boot-screen").hidden, false);
  assert.match(document.querySelector("#boot-screen h1").textContent, /Nie udało się potwierdzić sesji/);
  assert.equal(document.querySelector(".demo-banner").hidden, false);
  assert.equal(document.querySelector("#view-root").textContent.trim(), "");
  assert.equal(document.body.textContent.includes("Anna Przykładowa"), false);
  dom.window.close();
});

test("błąd danych sesji nie przełącza panelu na dane demonstracyjne", async () => {
  const dom = await openPanel(async (path) => {
    if (path === "/api/session") return json({ authenticated: true, user: { role: "operator", email: "ania@example.test", name: "Ania" } });
    if (path === "/api/submissions") return new Response("<html>Access login</html>", { headers: { "Content-Type": "text/html" } });
    return json({ items: [] });
  });
  const { document } = dom.window;
  assert.equal(document.body.classList.contains("mode-live"), true);
  assert.equal(document.querySelector("#boot-screen").hidden, true);
  assert.equal(document.querySelector("#view-root").textContent.includes("Anna Przykładowa"), false);
  assert.equal(document.querySelector("#view-root").textContent.includes("wymaga ponownego logowania"), false);
  assert.equal(document.querySelector("#demo-banner"), null);
  dom.window.close();
});

test("podgląd demonstracyjny nie zawiera starych wpisów ani testowych rekordów", async () => {
  const dom = await openPanel(async () => {
    throw new Error("Podgląd demonstracyjny nie powinien pobierać danych z API.");
  }, "https://preview.pages.dev/panel-v2/");
  const { document, location } = dom.window;
  const root = document.querySelector("#view-root");
  const oldDemoContent = [
    "PU-DEMO", "INV-DEMO", "Anna Przykładowa", "Jan Archiwalny",
    "18,4 MB", "21,7 MB", "23 wrz 2026", "example.invalid",
    "Dzisiaj, 09:14", "kontakt@example.invalid"
  ];

  assert.equal(document.body.classList.contains("mode-demo"), true);
  assert.match(root.textContent, /Aktywne sprawy\s*0/);
  assert.match(root.textContent, /Brak zarejestrowanej aktywności/);

  for (const route of ["cases", "invitations", "archive", "retention", "backups", "audit", "users", "settings"]) {
    location.hash = `#${route}`;
    await new Promise((resolve) => setTimeout(resolve, 5));
    for (const staleText of oldDemoContent) {
      assert.equal(root.textContent.includes(staleText), false, `${route} zawiera starą wartość: ${staleText}`);
    }
  }

  assert.match(root.textContent, /Brak konfiguracji w podglądzie/);
  dom.window.close();
});


test("linki ankiet pokazują 14 dni z konfiguracji Workera, a zamknięcie nie waliduje pustego formularza", async () => {
  const dom = await openPanel(async (path) => {
    if (path === "/api/session") return json({ authenticated: true, user: { role: "admin", email: "admin@example.test", name: "Mariusz" } });
    if (path === "/api/submissions") return json({ items: [] });
    if (path === "/api/admin/invitations") return json({ items: [] });
    if (path === "/api/health") return json({ invitation_validity_days: 14 });
    return json({ items: [] });
  });
  const { document, location } = dom.window;
  location.hash = "#invitations";
  await new Promise((resolve) => setTimeout(resolve, 10));

  const root = document.querySelector("#view-root");
  assert.match(root.textContent, /Ważność: 14 dni/);
  root.querySelector('[data-action="new-invitation"]').click();

  const modal = document.querySelector("#action-modal");
  assert.equal(modal.open, true);
  const modalBody = document.querySelector("#modal-body");
  assert.match(modalBody.textContent, /Ważność linku: 14 dni/);
  assert.doesNotMatch(modalBody.textContent, /7 dni/);

  document.querySelector('#action-modal-form [aria-label="Zamknij"]').click();
  assert.equal(modal.open, false);
  dom.window.close();
});

test("Więcej w sprawie otwiera podsumowanie zamiast komunikatu o nieaktywnej funkcji", async () => {
  const id = "01234567-89ab-4cde-8fab-0123456789ab";
  const dom = await openPanel(async (path) => {
    if (path === "/api/session") return json({ authenticated: true, user: { role: "operator", email: "ania@example.test", name: "Ania" } });
    if (path === "/api/submissions") return json({ items: [{ id, reference: "PU-2026-001", full_name: "Jan Kowalski", email: "jan@example.test", phone: "+48123123123", created_at: "2026-11-17T10:00:00.000Z", status: "new", payment_status: "awaiting", materials_status: "not_verified", order_price_gross_minor: 200000 }] });
    if (path === "/api/admin/invitations") return json({ items: [] });
    if (path === "/api/health") return json({ invitation_validity_days: 14 });
    if (path.endsWith("/attachments") || path.endsWith("/events")) return json({ items: [] });
    return json({ items: [] });
  });
  const { document, location } = dom.window;
  location.hash = `#case/${id}/overview`;
  await new Promise((resolve) => setTimeout(resolve, 20));
  document.querySelector('#view-root [data-action="case-details"]').click();
  const modal = document.querySelector("#action-modal");
  assert.equal(modal.open, true);
  assert.match(document.querySelector("#modal-title").textContent, /Szczegóły sprawy/);
  assert.match(document.querySelector("#modal-body").textContent, /Jan Kowalski/);
  assert.match(document.querySelector("#modal-body").textContent, /Otwórz ankietę/);
  assert.equal(document.querySelector("#toast-region .toast.warning"), null);
  dom.window.close();
});

test("adres e-mail do linku ankiety jest opcjonalny", async () => {
  const postBodies = [];
  const dom = await openPanel(async (path, options = {}) => {
    if (path === "/api/session") return json({ authenticated: true, user: { role: "admin", email: "admin@example.test", name: "Mariusz" } });
    if (path === "/api/submissions") return json({ items: [] });
    if (path === "/api/admin/invitations" && options.method === "POST") {
      postBodies.push(JSON.parse(options.body));
      return json({
        ok: true,
        item: { id: "01234567-89ab-4cde-8fab-0123456789ab", label: "Jan Kowalski", email: "", email_status: "not_requested", created_at: "2026-11-17T10:00:00.000Z", expires_at: "2026-12-01T10:00:00.000Z", status: "active" },
        email_delivery: { status: "not_requested", message: "Link utworzony bez e-maila." },
        invite_url: "https://pogotowieupadlosciowe.pl/ankieta.html?token=example"
      }, 201);
    }
    if (path === "/api/admin/invitations") return json({ items: [] });
    if (path === "/api/health") return json({ invitation_validity_days: 14 });
    return json({ items: [] });
  });
  const { document, location, Event } = dom.window;
  location.hash = "#invitations";
  await new Promise((resolve) => setTimeout(resolve, 10));
  document.querySelector('#view-root [data-action="new-invitation"]').click();
  const recipient = document.querySelector('#modal-body [name="recipient"]');
  const email = document.querySelector('#modal-body [name="email"]');
  recipient.value = "Jan Kowalski";
  assert.equal(email.required, false);
  document.querySelector("#action-modal-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(postBodies, [{ label: "Jan Kowalski", email: "" }]);
  assert.match(document.querySelector("#view-root").textContent, /Jan Kowalski/);
  dom.window.close();
});

test("adres wpisany przy tworzeniu linku trafia do API jako odbiorca wiadomości", async () => {
  let postedBody;
  const dom = await openPanel(async (path, options = {}) => {
    if (path === "/api/session") return json({ authenticated: true, user: { role: "admin", email: "admin@example.test", name: "Mariusz" } });
    if (path === "/api/submissions") return json({ items: [] });
    if (path === "/api/admin/invitations" && options.method === "POST") {
      postedBody = JSON.parse(options.body);
      return json({
        ok: true,
        item: { id: "11234567-89ab-4cde-8fab-0123456789ab", label: "Jan Kowalski", email: "jan@example.test", email_status: "sent", created_at: "2026-11-17T10:00:00.000Z", expires_at: "2026-12-01T10:00:00.000Z", status: "active" },
        email_delivery: { status: "sent", message: "Link do ankiety wysłano na jan@example.test." },
        invite_url: "https://pogotowieupadlosciowe.pl/ankieta.html?token=example"
      }, 201);
    }
    if (path === "/api/admin/invitations") return json({ items: [] });
    if (path === "/api/health") return json({ invitation_validity_days: 14 });
    return json({ items: [] });
  });
  const { document, location, Event } = dom.window;
  location.hash = "#invitations";
  await new Promise((resolve) => setTimeout(resolve, 10));
  document.querySelector('#view-root [data-action="new-invitation"]').click();
  document.querySelector('#modal-body [name="recipient"]').value = "Jan Kowalski";
  document.querySelector('#modal-body [name="email"]').value = "jan@example.test";
  document.querySelector("#action-modal-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(postedBody, { label: "Jan Kowalski", email: "jan@example.test" });
  assert.match(document.querySelector("#view-root").textContent, /E-mail wysłany/);
  dom.window.close();
});

test("usunięcie aktywnego linku z historii najpierw ostrzega o unieważnieniu", async () => {
  const id = "21234567-89ab-4cde-8fab-0123456789ab";
  const deleteRequests = [];
  const dom = await openPanel(async (path, options = {}) => {
    if (path === "/api/session") return json({ authenticated: true, user: { role: "admin", email: "admin@example.test", name: "Mariusz" } });
    if (path === "/api/submissions") return json({ items: [] });
    if (path === `/api/admin/invitations/${id}/history` && options.method === "DELETE") {
      deleteRequests.push([path, options.method]);
      return json({ ok: true, hidden: true, revoked: true, id });
    }
    if (path === "/api/admin/invitations") return json({ items: [{ id, label: "Jan Kowalski", email: "jan@example.test", email_status: "sent", created_at: "2026-11-17T10:00:00.000Z", expires_at: "2026-12-01T10:00:00.000Z", status: "active" }] });
    if (path === "/api/health") return json({ invitation_validity_days: 14 });
    return json({ items: [] });
  });
  const { document, location } = dom.window;
  location.hash = "#invitations";
  await new Promise((resolve) => setTimeout(resolve, 10));
  document.querySelector('#view-root [data-action="hide-invitation"]').click();
  assert.match(document.querySelector("#modal-body").textContent, /Aktywny link zostanie unieważniony/);
  assert.match(document.querySelector("#modal-body").textContent, /powiązanej sprawy nie usuniemy/);
  document.querySelector("#modal-confirm").click();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(deleteRequests, [[`/api/admin/invitations/${id}/history`, "DELETE"]]);
  assert.match(document.querySelector("#view-root").textContent, /Brak linków do ankiety/);
  dom.window.close();
});
