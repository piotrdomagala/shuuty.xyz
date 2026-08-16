# Design QA - Shuuty website refresh

## Źródło prawdy i środowisko

- Źródło wizualne: eksport aktualnego `origin/main` w
  `C:\Apps\shuuty.xyz\out`, oparty na commicie
  `7e3c0bdbf40cb7c8646de9a0be42648811e02638`.
- Implementacja: produkcyjny eksport gałęzi
  `agent/shuuty-xyz-refresh-2026` w
  `C:\Apps\.worktrees\shuuty-xyz-refresh-2026\out`.
- Przeglądarka: Microsoft Edge 151.0.4129.86 w trybie headless.
- Normalizacja: identyczny CSS viewport, `deviceScaleFactor: 1`, ten sam język,
  motyw, pozycja karuzeli i zredukowany ruch. W porównaniach sekcji ukryto wyłącznie
  stały header, skip link i mobilny dock, aby globalny chrome nie zasłaniał
  fotografowanego regionu.
- Surowe duplikaty capture i lokalne logi z absolutnymi ścieżkami zostały usunięte
  po kontroli. W repo pozostaje mały, reprezentatywny zestaw porównań.

## Macierz renderów

| Widok | CSS viewport | Źródło - piksele pełnej strony | Implementacja - piksele pełnej strony | DPR | Stan |
| --- | ---: | ---: | ---: | ---: | --- |
| Desktop | 1440 x 1100 | 1440 x 7062 | 1440 x 8043 | 1 | EN, Dark |
| Tablet | 1024 x 1366 | 1024 x 6947 | 1024 x 8151 | 1 | EN, Dark |
| Mobile | 390 x 844 | 390 x 10217 | 390 x 12720 | 1 | EN, Dark |

Dodatkowo porównano hero w Light Mode przy wszystkich trzech viewportach oraz
polskie hero na desktopie i mobile. Większa wysokość implementacji jest zamierzona:
wynika z konkretnego opisu mechanizmu grup i nowej sekcji głębi produktu, a nie
z rozciągniętych odstępów lub pustych regionów.

## Dowody

### Renderowana implementacja

- [Desktop - pełna strona](docs/qa/implementation-desktop-full.jpg)
- [Tablet - pełna strona](docs/qa/implementation-tablet-full.jpg)
- [Mobile - pełna strona](docs/qa/implementation-mobile-full.jpg)
- [Nowa sekcja głębi produktu - desktop](docs/qa/implementation-desktop-experience.jpg)
- [Nowa sekcja głębi produktu - mobile](docs/qa/implementation-mobile-experience.jpg)

### Porównania pełnego widoku i hero

- [Pełna strona - desktop](docs/qa/comparison-desktop-full.jpg)
- [Hero - desktop](docs/qa/comparison-desktop-hero.jpg)
- [Hero - tablet](docs/qa/comparison-tablet-hero.jpg)
- [Hero - mobile](docs/qa/comparison-mobile-hero.jpg)
- [Light hero - desktop](docs/qa/comparison-light-desktop-hero.jpg)
- [Light hero - tablet](docs/qa/comparison-light-tablet-hero.jpg)
- [Light hero - mobile](docs/qa/comparison-light-mobile-hero.jpg)
- [Polskie hero - desktop](docs/qa/comparison-pl-desktop-hero.jpg)
- [Polskie hero - mobile](docs/qa/comparison-pl-mobile-hero.jpg)

### Porównania skupionych regionów

- [Zadania - desktop](docs/qa/comparison-desktop-tasks.jpg)
- [Zadania - mobile](docs/qa/comparison-mobile-tasks.jpg)
- [Grupy - desktop](docs/qa/comparison-desktop-groups.jpg)
- [Grupy - mobile](docs/qa/comparison-mobile-groups.jpg)

## Obowiązkowe powierzchnie jakości

- Typografia - zachowano Outfit dla nagłówków i Plus Jakarta Sans dla treści,
  ten sam system wag, rytm linii i optyczną hierarchię. Nie ma clippingu,
  niezamierzonej truncation ani kolizji tekstu przy 1440, 1024 i 390 px.
- Spacing i rytm - istniejąca siatka, promienie, obramowania, cienie i gęstość
  pozostają spójne. Tablet i mobile przechodzą bez poziomego overflow. Dłuższy
  storytelling zachowuje wyraźne rozdziały zamiast zagęszczać pojedyncze ekrany.
- Kolory i tokeny - Golden Relay pozostaje oparty na granacie, złocie, błękicie
  i kontrolowanym świetle. Dark i Light używają tych samych semantycznych tokenów,
  a przełącznik aktualizuje również `theme-color`.
- Jakość i wierność obrazów - wszystkie widoczne ekrany są prawdziwymi,
  istniejącymi assetami produktu z `origin/main`. Usunięto pigułki zasłaniające
  ekrany oraz syntetyczną makietę voice/task. Pliki JPEG mają teraz prawidłowe
  rozszerzenie. Nie utworzono ani nie zrekonstruowano żadnego ekranu produktu.
- Copy - EN i PL mają identyczną strukturę, a test kontraktowy pilnuje parytetu.
  Hero wyjaśnia przepływ głos lub ręczne wejście -> osoba albo grupa -> kompletne
  zadanie. Grupy obejmują pracę, społeczność, usługi, sprzedaż, galerie,
  lokalizację, zainteresowania, rezerwacje, projekty, plany, czas i rozmowy.
  Copy nie ujawnia dostawców narzędzi ani modeli.

## Interakcje, accessibility i runtime

W Edge sprawdzono:

- klik, klawiaturę i swipe karuzeli trzech ekranów;
- stan `aria-pressed`, komunikat `aria-live` i trzy selektory po 44 x 44 px;
- przełączenie Dark/Light i zapis preferencji;
- przełączenie EN/PL wraz z `html[lang]` i zachowaniem kotwicy;
- nawigację do sekcji, skip link z widocznym focusem oraz FAQ open/close;
- trasy `/privacy/`, `/terms/`, `/support/` i ich odpowiedniki `/pl/`;
- jeden `h1`, landmark `main`, dostępne nazwy przycisków, brak brakujących
  obrazów po przewinięciu strony i brak poziomego overflow;
- kluczowe kontrolki mobile co najmniej 40 px, przy selektorach karuzeli 44 px;
- konsolę i wyjątki runtime - 0 błędów.

## Lab performance

Chrome DevTools MCP wymagany przez dedykowany workflow nie był skonfigurowany.
Zastosowano więc jawnie ograniczony fallback w tym samym Microsoft Edge:
trzy zimne przebiegi lokalnego eksportu i medianę.

| Scenariusz | FCP | LCP | CLS | TBT proxy | Transfer bez kompresji |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop 1440, lokalnie bez throttlingu | 148 ms | 148 ms | 0 | 0 ms | 844218 B |
| Mobile 390, 150 ms RTT, 1.6 Mbps, CPU x4 | 1280 ms | 1280 ms | 0 | 8 ms | 810974 B |

Aktualnym elementem LCP jest priorytetowy
`/images/app/create-menu.jpg`. Wyniki są danymi laboratoryjnymi, nie p75 CrUX.
Nie mierzą terenowego INP. Statyczny serwer QA nie stosował Brotli/Gzip, a obrazy
poniżej pierwszego ekranu pozostawały lazy do przewinięcia. Finalny budżet obrazów
musi zostać powtórzony po mechanicznym imporcie zaakceptowanego ZIP-a.

## Findings

Brak otwartych P0, P1 i P2.

Akceptowane, zamierzone różnice względem `origin/main`:

- hero nie ma pigułek `Tasks`, `Groups`, `Meetings` ani `Voice`;
- sekcja zadania nie udaje produktu w HTML/CSS - pokazuje prawdziwy ekran i opisuje
  przepływ w semantycznych krokach;
- podpisy prawdziwych ekranów znajdują się pod obrazami, nie na ich interfejsie;
- strona jest dłuższa o konkretną sekcję głębi produktu i pełniejszy model grup.

Zależność oczekująca, ale nie defekt tego PR-a:

- obecne cztery obrazy bazowe są wyłącznie EN i Light. PL/EN, iOS/Android oraz
  Light/Dark zostaną rozdzielone dopiero po zaakceptowanym artefakcie no-publish
  po PR #438. Kontrakt blokuje częściowe, kandydackie i niepowiązane importy.

## Historia porównania

### Iteracja bazowa

- P1 - pigułki hero zasłaniały prawdziwe ekrany. Usunięto je bez zmiany mechaniki
  karuzeli.
- P1 - sekcja voice/task była fikcyjną makietą HTML/CSS z etykietą AI. Zastąpiono
  ją istniejącym prawdziwym ekranem oraz semantycznym opisem Golden Relay.
- P2 - podpisy map zasłaniały produkt. Przeniesiono je poza obszar obrazu.
- P2 - layout tabletowy miał ryzyko overflow przy długim copy. Usunięto twarde
  minima i potwierdzono `scrollWidth === innerWidth` na 1440, 1024 i 390 px.

### Końcowa iteracja

Po poprawkach wykonano pełne i skupione porównania przy tych samych viewportach
i stanach. Dowody powyżej pokazują zachowaną typografię, tokeny, proporcje telefonów
i hierarchię, bez wcześniejszych nakładek. Nie znaleziono kolejnych P0/P1/P2,
więc nie była potrzebna następna iteracja wizualna.

## Implementation checklist

- [x] Desktop, tablet i mobile - Dark
- [x] Desktop, tablet i mobile - Light hero
- [x] EN i PL
- [x] Karuzela: click, keyboard, swipe
- [x] Theme, language, anchors i FAQ
- [x] Privacy, terms i support w obu językach
- [x] Brak poziomego overflow i błędów runtime
- [x] Pełne oraz skupione porównania source vs implementation
- [x] Lab performance fallback i jawne ograniczenia pomiaru
- [x] Niezależny code review bez otwartych findings

## Open questions

Brak pytań blokujących ten PR. Import docelowych obrazów pozostaje osobną,
mechaniczną zmianą po zaakceptowaniu kompletnego pakietu sklepowego.

final result: passed
