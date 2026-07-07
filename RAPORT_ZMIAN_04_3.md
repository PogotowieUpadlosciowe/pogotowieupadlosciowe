# Raport zmian PRELAUNCH 04.3

## Decyzje UX

1. **Strona główna — usunięto sekcję „Dane i dokumenty”.**
   Informacja powtarzała proces współpracy i nadmiernie wydłużała stronę. Zasada bezpiecznego przekazywania danych pozostaje widoczna na stronie Kontakt, w prywatnej ankiecie i FAQ.

2. **Kontakt — usunięto końcowy baner o zdalnej współpracy.**
   Ta sama informacja jest już zawarta w nagłówku, kartach kontaktu i opisie pierwszego kontaktu.

3. **O nas — usunięto końcowy baner o zdalnej współpracy.**
   Powtarzał treść strony i powodował niekorzystne zagęszczenie układu.

4. **FAQ — przebudowano elementy rozwijane.**
   Każde pytanie ma wyraźną kartę, ikonę plus/minus, stan hover, fokus klawiatury i krótką instrukcję obsługi. Wszystkie pytania są początkowo zwinięte.

5. **Cennik — usunięto skrócone FAQ.**
   Pytania cenowe pozostają w pełnej zakładce FAQ. Cennik kończy się teraz zwięzłym wezwaniem do kontaktu.

6. **Cennik — doprecyzowano poprawki.**
   Karta jednoznacznie informuje o jednej rundzie poprawek. Oznaczenie `1×` zastąpiło mylące `3`.

## Kalendarz wideorozmowy

- kalendarz jest domyślnie ukryty;
- na stronie Kontakt dodano osobną kartę „Wideorozmowa” z przyciskiem „Umów wideorozmowę”;
- iframe Google jest ładowany dopiero po kliknięciu, co ogranicza zbędne połączenia z Google;
- po Szybkiej ocenie przycisk prowadzi do `kontakt.html?rezerwacja=1#kalendarz` i automatycznie pokazuje kalendarz;
- inne przyciski prowadzą tylko do strony Kontakt — nie otwierają automatycznie kalendarza;
- nad kalendarzem pokazana jest sekwencja: **1. wybierz dzień → 2. wybierz godzinę**;
- do adresu Google dodano język polski i strefę `Europe/Warsaw`.

### Ograniczenie techniczne

Wewnętrzny interfejs iframe należy do Google. Strona może sterować momentem wyświetlenia, rozmiarem, językiem i strefą czasową, ale nie może nadpisać jego wewnętrznego CSS ani zagwarantować formatu 24-godzinnego na każdym urządzeniu. Ostateczny format może zależeć od ustawień języka i regionu Google lub urządzenia odwiedzającego. Pełna gwarancja formatu 24 h wymagałaby własnego interfejsu rezerwacji połączonego z Google Calendar API.

## Pliki zmienione

- `index.html`
- `kontakt.html`
- `o-nas.html`
- `faq.html`
- `cennik.html`
- `uslugi.html`
- `assets/client-public.css`
- `assets/site.js`

## Walidacja

- `node --check assets/site.js` — OK;
- `node --check assets/form.js` — OK;
- `node --check assets/admin.js` — OK;
- brak powielonych identyfikatorów HTML;
- wszystkie lokalne odwołania do plików istnieją;
- test otwierania i zamykania kalendarza — OK;
- test rozwijania FAQ — OK;
- strona nadal pozostaje w trybie PRELAUNCH / `noindex`.

## Wdrożenie

Wgraj zawartość paczki minimalnej do głównego katalogu repozytorium na gałęzi `main`.

Proponowany commit:

`Improve booking flow, FAQ and client page layout`
