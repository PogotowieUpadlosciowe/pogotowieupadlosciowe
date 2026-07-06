PU Panel operatora 02.1 — poprawka czytelności i wykorzystania przestrzeni

Zmienione pliki:
- admin.html
- assets/admin.css
- assets/admin.js

Co poprawiono:
1. Naprawiono niewidoczną nazwę aktywnej zakładki. Przyczyną była brakująca zmienna CSS --navy.
2. Aktywna zakładka ma teraz wyraźne granatowe tło, biały tekst i licznik.
3. Po prawidłowym pobraniu danych górny panel logowania zwija się do małego paska „Sesja operatora aktywna”.
4. Ukrywana jest wtedy informacja o zabezpieczeniach, aby odzyskać miejsce w pionie.
5. Zmniejszono nagłówek, odstępy, karty statystyk, filtry i listę zgłoszeń.
6. Zachowano wersję mobilną i przewijane zakładki na małych ekranach.

Wdrożenie:
1. Rozpakuj ZIP.
2. Na GitHubie wybierz gałąź main.
3. Add file -> Upload files.
4. Przeciągnij admin.html oraz folder assets z paczki.
5. Commit: Improve operator panel navigation and spacing
6. Po wdrożeniu Cloudflare otwórz /admin.html i naciśnij Ctrl+F5.

Nie ma zmian w Workerze ani w D1.
