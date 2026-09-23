# Panel Pogotowia Upadłościowego 2.0 — prototyp

Interaktywny prototyp nowego, prywatnego panelu operacyjnego. Wszystkie widoczne w nim osoby, numery spraw, dane finansowe i dokumenty są fikcyjne. Prototyp nie łączy się z produkcyjną bazą, Workerem ani magazynem plików.

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

## Docelowa architektura

Panel powinien działać na prywatnej domenie, np. `panel.pogotowieupadlosciowe.pl`, jako osobna aplikacja za Cloudflare Access i MFA. Interfejs i API powinny być obsługiwane przez prywatnego Workera w tym samym źródle, bez zapisywania tokenu administratora w `localStorage` ani `sessionStorage`.

Worker weryfikuje tożsamość z Cloudflare Access oraz rolę użytkownika przy każdej operacji:

- `operator` — bieżąca obsługa spraw, klientów, dokumentów, płatności, zadań i linków do ankiety;
- `admin` — dodatkowo retencja, kopie, audyt, konfiguracja, użytkownicy i działania nieodwracalne.

Sesja może być ważna przez 12 godzin. Odświeżenie strony i zamknięcie karty nie powinny kończyć sesji przed jej wygaśnięciem; dostępny będzie jawny przycisk wylogowania.

## Bezpieczna kolejność wdrożenia

1. Akceptacja wyglądu i przebiegu pracy na danych fikcyjnych.
2. Utworzenie prywatnego Workera oraz Cloudflare Access/MFA.
3. Podłączenie obecnej bazy i plików w trybie tylko do odczytu.
4. Dodanie kontroli ról, audytu i brakujących tabel zadań, checklist i notatek.
5. Włączenie operacji zapisu oraz testy na osobnych rekordach.
6. Równoległe używanie starego i nowego panelu przez krótki okres.
7. Przełączenie zespołu na Panel 2.0 z zachowaniem starego panelu jako czasowej ścieżki awaryjnej.

## Uruchomienie lokalne

Z katalogu głównego repozytorium:

```bash
python3 -m http.server 4173
```

Następnie otwórz `http://127.0.0.1:4173/panel-v2/`.
