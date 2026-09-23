# Prywatny Worker Panelu 2.0

Ten Worker zabezpiecza nowy panel przed dostępem publicznym i łączy go z istniejącym Workerem formularza. Przeglądarka użytkownika nigdy nie otrzymuje `ADMIN_TOKEN`.

## Zasada działania

1. Cloudflare Access wpuszcza użytkownika po logowaniu i MFA.
2. Worker ponownie weryfikuje podpis, wystawcę, odbiorcę i czas ważności tokenu Access.
3. Adres e-mail jest przypisywany do roli `admin` albo `operator`.
4. Każda trasa API ma własną listę dozwolonych ról i operacji.
5. Dopiero wtedy Worker przekazuje żądanie do obecnego API, dodając sekret po stronie serwera.

## Role

- `Mariusz` (`admin`) — pełna obsługa spraw oraz retencja, kopie, archiwum i operacje administracyjne.
- `Ania` (`operator`) — obsługa spraw, dokumentów, płatności i linków do ankiety, bez dostępu do retencji, kopii, trwałego usuwania i korekt administracyjnych.

Nazwy wyświetlane w panelu są krótkie. Uprawnienia wynikają wyłącznie ze zweryfikowanego adresu e-mail, a nie z nazwy przesłanej przez przeglądarkę.

## Konfiguracja przed pierwszym wdrożeniem

W `wrangler.jsonc` trzeba zastąpić cztery wartości `UZUPELNIJ`:

- `ACCESS_TEAM_DOMAIN` — domena zespołu Access, np. `firma.cloudflareaccess.com`;
- `ACCESS_AUD` — Audience Tag aplikacji Access utworzonej dla panelu;
- `ADMIN_EMAILS` — adres logowania Mariusza;
- `OPERATOR_EMAILS` — adres logowania Ani.

Sekretu nie zapisujemy w pliku ani w repozytorium. Ustawia się go bezpośrednio w Cloudflare:

```bash
cd panel-worker
npx wrangler secret put ADMIN_TOKEN
```

Wartość musi być identyczna z `ADMIN_TOKEN` obecnego Workera API.

## Ustawienia Cloudflare Access

1. Utwórz aplikację typu Self-hosted dla `panel.pogotowieupadlosciowe.pl`.
2. Ustaw czas sesji aplikacji na 12 godzin.
3. Dodaj regułę zezwalającą wyłącznie na oba ustalone adresy e-mail.
4. Wymuś MFA w polityce Access albo w używanym dostawcy tożsamości.
5. Skopiuj Audience Tag do `ACCESS_AUD`.
6. Dopiero po testach przypnij trasę DNS do wdrożonego Workera.

## Kontrola lokalna

```bash
cd panel-worker
npm install
npm run check
```

Testy sprawdzają m.in. podpis tokenu Access, rozdział ról, blokadę retencji dla operatora oraz to, że token backendu jest dokładany dopiero po stronie Workera.

## Bezpieczna publikacja

Najpierw wdrażamy Workera bez publicznej trasy, konfigurujemy Access i wykonujemy testy na obu kontach. Produkcyjną domenę panelu przypinamy dopiero po potwierdzeniu, że:

- niezalogowany użytkownik nie widzi żadnego zasobu;
- Mariusz widzi sekcje administracyjne;
- Ania ich nie widzi i otrzymuje `403` także przy bezpośrednim wywołaniu API;
- sprawy, załączniki i historia są pobierane z obecnego Workera;
- utworzenie linku i oznaczenie płatności zapisują się w systemie;
- w pamięci przeglądarki i żądaniach frontendowych nie ma `ADMIN_TOKEN`.
