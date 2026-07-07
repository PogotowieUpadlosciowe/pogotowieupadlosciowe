# PRELAUNCH 04.3 — poprawki UX części klienckiej

## Zakres zmian

- kalendarz wideorozmowy jest domyślnie ukryty i ładuje się dopiero po kliknięciu „Umów wideorozmowę” na stronie Kontakt;
- po zakończeniu Szybkiej oceny przycisk otwiera stronę Kontakt i automatycznie rozwija kalendarz;
- pozostałe przyciski na stronie prowadzą do Kontakt, ale nie otwierają kalendarza automatycznie;
- kalendarz otrzymał czytelną sekwencję „1. wybierz dzień → 2. wybierz godzinę”;
- iframe Google otrzymuje polski język i strefę Europe/Warsaw;
- usunięto sekcję „Dane i dokumenty” ze strony głównej jako powtórzenie procesu;
- usunięto powtarzające się banery „Bez wychodzenia z domu” ze stron Kontakt i O nas;
- FAQ otrzymało wyraźne karty, ikonę plus/minus, fokus klawiatury i instrukcję rozwijania;
- usunięto mini-FAQ z Cennika, pozostawiając pełną zakładkę FAQ;
- karta poprawek w Cenniku jednoznacznie wskazuje jedną rundę poprawek.

## Ważne ograniczenie Google Calendar

Wewnętrzny wygląd i format czasu strony rezerwacji są kontrolowane przez Google. Frontend ustawia język `pl` i strefę `Europe/Warsaw`, ale ostateczny zapis 12/24 h może być dodatkowo zależny od ustawień języka i regionu Google lub urządzenia odwiedzającego. Gwarantowany format 24-godzinny wymagałby własnego interfejsu rezerwacji połączonego z Google Calendar API.

## Wdrożenie

Wgraj zawartość paczki minimalnej do głównego katalogu repozytorium GitHub na gałęzi `main`.

Proponowany commit:

`Improve booking flow, FAQ and client page layout`
