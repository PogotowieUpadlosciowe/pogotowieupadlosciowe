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
