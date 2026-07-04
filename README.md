# Pogotowie Upadłościowe — paczka do wdrożenia na GitHub

## Zakres tej aktualizacji

- Hero strony głównej zostało przebudowane zgodnie z przekazanymi zrzutami ekranu.
- Zdjęcie wypełnia całe tło Hero i wykorzystuje istniejące pliki `hero-zdalnie.jpg` oraz `hero-zdalnie-mobile.jpg`.
- Po lewej stronie zastosowano płynny biały blend, dzięki czemu tekst pozostaje czytelny, a granica obrazu jest niewidoczna.
- Dolna część zdjęcia przechodzi miękko w białe tło następnej sekcji.
- Nagłówek ma duży, elegancki krój szeryfowy oraz układ wierszy zgodny z załącznikami.
- Pod opisem znajdują się dwa przyciski i trzy najważniejsze informacje: obsługa zdalna, termin do 3 dni roboczych i cena 2000 zł brutto.
- Usunięto dodatkową kartę nakładaną wcześniej na zdjęcie Hero.
- Nie dodano nowych arkuszy CSS ani zbędnych wariantów plików. Zmieniono istniejące `index.html` i `assets/home-v2.css`.
- Pozostałe podstrony i funkcje formularza nie zostały przebudowane.

## Najważniejsze zmienione pliki

- `index.html`
- `assets/home-v2.css`

## Publikacja

Rozpakuj paczkę i wgraj całą jej zawartość do katalogu głównego repozytorium GitHub, zastępując istniejące pliki. `index.html` powinien znajdować się bezpośrednio w katalogu głównym repozytorium.

Po wdrożeniu wykonaj twarde odświeżenie strony skrótem `Ctrl + F5`.

## Ważne

Regulamin i polityka prywatności pozostają dokumentami roboczymi. Strona nadal zawiera ustawienie `noindex`.


## Aktualizacja prawna i ankieta — 2026-07-04

- `regulamin.html`: projekt Regulaminu świadczenia usług, wersja `REG-2026-07-04-01`.
- `polityka-prywatnosci.html`: projekt Polityki prywatności, wersja `PP-2026-07-04-01`.
- `ankieta.html`: podsumowanie zamówienia, jeden obowiązkowy checkbox i przycisk „Zamawiam z obowiązkiem zapłaty”.
- `assets/form.js`: przesyła metadane wersji dokumentów i oświadczeń; zachowuje zgodność z dotychczasowym polem `privacy`.
- Dokumenty pozostają oznaczone jako projekty, ponieważ działalność nie jest jeszcze zarejestrowana. Nie zdejmować `noindex` i nie przyjmować rzeczywistych zamówień przed uzupełnieniem danych firmy oraz końcową weryfikacją dokumentów.
- Automatyczne usuwanie nieopłaconych spraw po 14 dniach od udostępnienia ankiety wymaga osobnego wdrożenia mechanizmu zaproszeń i retencji w Workerze.
