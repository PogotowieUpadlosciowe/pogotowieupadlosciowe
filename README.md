# Pogotowie Upadłościowe

Repozytorium frontendu serwisu [pogotowieupadlosciowe.pl](https://pogotowieupadlosciowe.pl/). Projekt obejmuje publiczną stronę informacyjną, prywatną ankietę klienta oraz panel operatora.

> Stan: publiczna strona i prywatna ankieta działają produkcyjnie. Indeksowanie pozostaje wyłączone. Testy przeprowadzaj na danych fikcyjnych.

## Struktura

- `index.html` — strona główna i Szybka ocena
- `uslugi.html`, `cennik.html`, `faq.html`, `o-nas.html`, `kontakt.html` — strony publiczne
- `ankieta.html` — prywatny formularz klienta
- `admin.html` — starszy interfejs panelu; prywatny panel działa pod `panel.pogotowieupadlosciowe.pl`, a jego kod jest rozwijany osobno w PR #17
- `regulamin.html`, `polityka-prywatnosci.html` — opublikowane dokumenty prawne
- `assets/` — arkusze stylów i JavaScript (arkusz strony głównej: `home.css`)
- `images/` — obrazy i identyfikacja wizualna
- `documents/` — wersjonowane dokumenty używane przez ankietę
- `_headers`, `robots.txt`, `sitemap.xml` — konfiguracja publikacji i indeksowania

Kod API Workera, baza D1 oraz ich konfiguracja produkcyjna nie znajdują się na gałęzi `main`. Ankieta i panel łączą się z API przez `https://api.pogotowieupadlosciowe.pl`. Techniczne nazwy aktywnych Workerów w Cloudflare wymagają osobnej migracji.

W ankiecie Worker przekazuje ustawienia techniczne, dostępność formularza, cenę
liczbową i wersje dokumentów. Zatwierdzone opisy usługi widoczne w podsumowaniu
zamówienia są utrzymywane w `assets/form.js`, aby pozostawały spójne z publiczną
stroną i dokumentami również wtedy, gdy konfiguracja Workera zawiera starsze
brzmienie tekstów.

## Zasady pracy

1. Nie wprowadzaj zmian bezpośrednio na `main`.
2. Utwórz osobną gałąź i pull request.
3. Nie usuwaj ani nie zmieniaj `documents/` bez sprawdzenia odwołań w ankiecie.
4. Nie włączaj indeksowania przed zakończeniem przeglądu prawnego, bezpieczeństwa i całego procesu zamówienia.
5. Przed wdrożeniem sprawdź responsywność, lokalne odwołania do plików oraz składnię JavaScript.

## Kontrola techniczna

Dla plików JavaScript można wykonać:

```bash
node --check assets/site.js
node --check assets/form.js
node --check assets/admin.js
```

Po zmianach wizualnych sprawdź co najmniej stronę główną i zmienione podstrony na komputerze oraz telefonie.

## Wdrożenie

Publikacja frontendu odbywa się z gałęzi `main` przez skonfigurowane wdrożenie Cloudflare. Merge pull requesta powinien nastąpić dopiero po przejrzeniu różnic i akceptacji zmiany.

Historia ważniejszych iteracji znajduje się w [CHANGELOG.md](CHANGELOG.md).
