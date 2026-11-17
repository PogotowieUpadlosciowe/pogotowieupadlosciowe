# Panel Pogotowia Upadłościowego 2.0

Interfejs nowego, prywatnego panelu operacyjnego działa w dwóch kontrolowanych trybach:

- jako zwykła strona statyczna pokazuje pusty podgląd, bez spraw, zaproszeń, aktywności, kopii zapasowych ani konfiguracji produkcyjnej;
- uruchomiony przez `panel-worker` za Cloudflare Access pobiera prawdziwe sprawy z obecnego Workera i stosuje uprawnienia Mariusza (`admin`) oraz Ani (`operator`).

Akcje wykonane w podglądzie są tymczasowe i znikają po odświeżeniu. Prawdziwe dane i konfiguracja są pobierane wyłącznie po zalogowaniu do prywatnego panelu.

## Co można sprawdzić

- w statycznym podglądzie: nawigację, mobilny układ, puste listy i tymczasowe utworzenie linku demonstracyjnego;
- po zalogowaniu do prywatnego panelu: sprawy, ich podsumowanie i historię, dokumenty, załączniki, płatności, wysyłkę linku do ankiety e-mailem i dostępne widoki administratora;
- w podglądzie można przełączać widok administratora i operatora. Nie zmienia to uprawnień produkcyjnych.

## Architektura prywatna

Panel jest przygotowany do działania na prywatnej domenie, np. `panel.pogotowieupadlosciowe.pl`, jako osobna aplikacja za Cloudflare Access i MFA. Interfejs i API obsługuje prywatny Worker z katalogu `panel-worker`. Token administratora pozostaje sekretem Workera i nie jest zapisywany w `localStorage`, `sessionStorage` ani kodzie strony.

Worker weryfikuje tożsamość z Cloudflare Access oraz rolę użytkownika przy każdej operacji:

- `operator` — bieżąca obsługa spraw, klientów, dokumentów, płatności, zadań i linków do ankiety;
- `admin` — dodatkowo retencja, kopie, audyt, konfiguracja, użytkownicy i działania nieodwracalne.

Sesja może być ważna przez 12 godzin. Odświeżenie strony i zamknięcie karty nie powinny kończyć sesji przed jej wygaśnięciem; dostępny będzie jawny przycisk wylogowania.

## Stan integracji

- podłączone: sprawy, pełne odpowiedzi ankiety, zgody, statusy zamówienia i e-maili, historia zdarzeń, lista i pobieranie załączników oraz linki do ankiety;
- zapisywane: nowe linki do ankiety, opcjonalna wysyłka zaproszenia na podany adres e-mail, ukrywanie linków w historii, notatki wewnętrzne i potwierdzenie płatności;
- usunięcie linku z historii nie usuwa zapisanej ankiety ani powiązanej sprawy; aktywny link jest przy tym unieważniany;
- zabezpieczone po stronie serwera: role, trasy administracyjne i dozwolony zakres zmian;
- celowo wyłączone do następnego etapu: ręczne zadania, strukturalna lista wierzycieli, edycja checklisty, wysyłka przypomnień, korekty administracyjne i zarządzanie użytkownikami. Panel pokazuje te ograniczenia, a produkcyjne przyciski nie udają zapisanych zmian.

Instrukcja konfiguracji i testów znajduje się w `panel-worker/README.md`.

## Uruchomienie lokalne

Z katalogu głównego repozytorium:

```bash
python3 -m http.server 4173
```

Następnie otwórz `http://127.0.0.1:4173/panel-v2/`.
