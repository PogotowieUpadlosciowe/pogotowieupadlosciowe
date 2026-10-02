# Panel Pogotowia Upadłościowego 2.0

Interfejs nowego, prywatnego panelu operacyjnego działa w dwóch kontrolowanych trybach:

- jako zwykła strona statyczna pokazuje wyłącznie dane fikcyjne i nie łączy się z produkcją;
- uruchomiony przez `panel-worker` za Cloudflare Access pobiera prawdziwe sprawy z obecnego Workera i stosuje uprawnienia Mariusza (`admin`) oraz Ani (`operator`).

Adresy e-mail, numery dokumentów i rachunek widoczne w prototypie są celowo niepoprawnymi wartościami demonstracyjnymi (`example.invalid`, `DEMO`). Prawidłowa konfiguracja produkcyjna nie jest zapisana w tej publicznej gałęzi.

## Co można sprawdzić

- pulpit zadaniowy z priorytetami i alertami;
- wyszukiwanie i filtrowanie spraw;
- pełną kartę sprawy z etapami, zadaniami, notatkami i historią;
- ankietę z maskowaniem danych chronionych i symulowanym audytem dostępu;
- wierzycieli, dokumenty, załączniki, zamówienie i płatność;
- tworzenie jednorazowych linków do ankiety;
- archiwum;
- widoki administratora: retencja, kopie zapasowe, audyt, użytkownicy i konfiguracja;
- przełączanie podglądu między rolą administratora i operatora;
- układ mobilny.

## Architektura prywatna

Panel jest przygotowany do działania na prywatnej domenie, np. `panel.pogotowieupadlosciowe.pl`, jako osobna aplikacja za Cloudflare Access i MFA. Interfejs i API obsługuje prywatny Worker z katalogu `panel-worker`. Token administratora pozostaje sekretem Workera i nie jest zapisywany w `localStorage`, `sessionStorage` ani kodzie strony.

Worker weryfikuje tożsamość z Cloudflare Access oraz rolę użytkownika przy każdej operacji:

- `operator` — bieżąca obsługa spraw, klientów, dokumentów, płatności, zadań i linków do ankiety;
- `admin` — dodatkowo retencja, kopie, audyt, konfiguracja, użytkownicy i działania nieodwracalne.

Sesja może być ważna przez 12 godzin. Odświeżenie strony i zamknięcie karty nie powinny kończyć sesji przed jej wygaśnięciem; dostępny będzie jawny przycisk wylogowania.

## Stan integracji

- podłączone: sprawy, pełne odpowiedzi ankiety, zgody, statusy zamówienia i e-maili, historia zdarzeń, lista i pobieranie załączników oraz linki do ankiety;
- zapisywane: nowe linki do ankiety, notatki wewnętrzne i potwierdzenie płatności;
- zabezpieczone po stronie serwera: role, trasy administracyjne i dozwolony zakres zmian;
- celowo wyłączone do następnego etapu: osobne zadania, strukturalna lista wierzycieli, edycja checklisty, wysyłka przypomnień i zarządzanie użytkownikami. Obecny backend nie ma jeszcze bezpiecznego modelu danych dla tych funkcji.

Instrukcja konfiguracji i testów znajduje się w `panel-worker/README.md`.

## Uruchomienie lokalne

Z katalogu głównego repozytorium:

```bash
python3 -m http.server 4173
```

Następnie otwórz `http://127.0.0.1:4173/panel-v2/`.
