import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const root = new URL("../../", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");
const script = await readFile(new URL("assets/site.js", root), "utf8");

function runQuiz(answers) {
  const dom = new JSDOM(html, { url: "https://pogotowieupadlosciowe.pl/", runScripts: "outside-only" });
  const { document, Event, MouseEvent } = dom.window;
  dom.window.eval(script);

  answers.forEach((answer, index) => {
    const name = ["business", "payments", "delay"][index];
    const input = document.querySelector(`input[name="${name}"][value="${answer}"]`);
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelector("[data-quick-next]").dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const result = [...document.querySelectorAll("[data-quick-result]")].find((element) => !element.hidden);
  const type = result?.dataset.quickResult;
  dom.window.close();
  return type;
}

test("szybka ocena poprawnie rozstrzyga wszystkie kombinacje odpowiedzi", () => {
  for (const business of ["A", "B"]) {
    for (const payments of ["A", "B"]) {
      for (const delay of ["A", "B"]) {
        const expected = business === "A" ? "business"
          : payments === "A" ? "current"
            : delay === "A" ? "early" : "positive";
        assert.equal(runQuiz([business, payments, delay]), expected, `${business}/${payments}/${delay}`);
      }
    }
  }
});

test("odpowiedzi Nie / Nie / ponad 3 miesiące kwalifikują do usługi", () => {
  assert.equal(runQuiz(["B", "B", "B"]), "positive");
});
