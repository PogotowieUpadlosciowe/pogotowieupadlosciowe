# Pogotowie Upadłościowe

Repozytorium frontendu serwisu [pogotowieupadlosciowe.pl](https://pogotowieupadlosciowe.pl/). Projekt obejmuje publiczną stronę informacyjną, prywatną ankietę klienta oraz panel operatora.

> Status: PRELAUNCH. Serwis nie jest jeszcze gotowy do obsługi prawdziwych klientów. Indeksowanie pozostaje wyłączone, a formularze powinny być testowane wyłącznie na fikcyjnych danych.

## Struktura

- `index.html` — strona główna i Szybka ocena
- `uslugi.html`, `cennik.html`, `faq.html`, `o-nas.html`, `kontakt.html` — strony publiczne
- `ankieta.html` — prywatny formularz klienta
- `admin.html` — panel operatora
- `regulamin.html`, `polityka-prywatnosci.html` — dokumenty prawne w wersji roboczej
- `assets/` — arkusze stylów i JavaScript
- `images/` — obrazy i identyfikacja wizualna
- `documents/` — wersjonowane dokumenty używane przez ankietę
- `_headers`, `robots.txt`, `sitemap.xml` — konfiguracja publikacji i indeksowania

Backend Cloudflare Worker, baza D1 oraz ich konfiguracja produkcyjna nie znajdują się w tym repozytorium.

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
