# Pogotowie Upadłościowe — paczka do wdrożenia na GitHub

## Zakres tej aktualizacji

- Strona główna korzysta z przekazanego zdjęcia Hero przedstawiającego pracę nad dokumentami.
- Obraz Hero jest wyświetlany w pełnym kadrze na komputerach i ma miękkie, niewidoczne krawędzie połączone z białym tłem strony.
- Wersja mobilna wykorzystuje kadr wykonany z tego samego zdjęcia.
- Z nagłówka usunięto przycisk „Sprawdź swoją sytuację”. Przycisk pozostaje wyłącznie w treści strony głównej.
- Nawigacja na wszystkich stronach ma identyczną kolejność: Strona główna, Usługi, Cennik, FAQ, O nas, Kontakt.
- Logo, odstępy i sposób oznaczenia aktywnej zakładki są takie same na każdej podstronie, dzięki czemu przyciski menu nie zmieniają położenia.
- Maksymalna szerokość strony została zwiększona z 1220 px do 1440 px, aby witryna była czytelniejsza na laptopach i większych ekranach.
- Nie dodano nowego arkusza stylów. Zaktualizowano istniejące pliki `assets/styles.css` i `assets/home-v2.css`.

## Najważniejsze zmienione pliki

- `index.html`
- `assets/styles.css`
- `assets/home-v2.css`
- `images/hero-zdalnie.jpg`
- `images/hero-zdalnie-mobile.jpg`
- publiczne pliki HTML — ujednolicenie kolejności nawigacji

## Publikacja

Rozpakuj paczkę i wgraj całą jej zawartość do katalogu głównego repozytorium GitHub, zastępując istniejące pliki. `index.html` powinien znajdować się bezpośrednio w katalogu głównym repozytorium, a nie w dodatkowym podfolderze.

Po wdrożeniu wykonaj twarde odświeżenie strony skrótem `Ctrl + F5`.

## Ważne

Regulamin i polityka prywatności pozostają dokumentami roboczymi. Strona nadal zawiera ustawienie `noindex`.
