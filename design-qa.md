# Design QA - spatial task handoff

## Zakres i źródło prawdy

- Zakres tej iteracji: sekcja `01 Tasks` / `01 Zadania`, prawdziwe media produktu,
  bardziej zróżnicowany rytm sekcji oraz końcowe QA landingu.
- Wybrany kierunek wizualny: wariant 3 - przestrzenne przekazanie zadania.
- Hero zachowuje zaakceptowaną płynną karuzelę, ale nie nakłada pigułek na UI.
- Referencja kompozycji:
  `C:\Users\piotr\.codex\generated_images\01a00bba-e0a8-7631-b549-4b31f76c0d8c\exec-e3c8a91f-f42f-40e5-bcbd-c2b3a1246ffb.png`.
  Referencja służy wyłącznie do oceny rytmu, perspektywy i skali. Nie jest częścią
  builda, ponieważ zawiera wygenerowane UI.
- Źródłem prawdziwego UI jest 16 kanonicznych capture PL/EN z
  `piotrdomagala/S-` na commicie
  `20a14889e2397514b7c7bcd73269508f24c8004f`.
- Golden Relay jest dokładną kopią
  `store-listing/assets/brand/golden-relay-transparent-2048x256.png`, SHA-256
  `4e49a0b5b2f07f5cb934321d573173463e5ab10d986c29acf64593548956ce15`.

Kanoniczne PNG pozostają byte-for-byte źródłami provenance. Strona renderuje ich
deterministyczne, półskalowe pochodne WebP. Każda pochodna ma osobny hash, rozmiar,
`sourceSha256`, encoder i wersję libvips. Runtime nie ma fallbacku do PNG.

## Wybrana kompozycja

Sekcja Tasks używa trzech realnych ekranów jako jednej sekwencji:

1. Capture - `Say it.` / `Powiedz.`
2. Context - `Choose a person or group.` / `Wybierz osobę lub grupę.`
3. Hand-off - `Delegate now. The task is ready.` / `Deleguj teraz. Zadanie jest gotowe.`

Aktywny ekran rośnie, rozjaśnia się i wychodzi do przodu. Pozostałe ekrany
zachowują kontekst, ale nie konkurują z aktywnym. Prawdziwy Golden Relay łączy
sekwencję poza warstwą interfejsu produktu.

Product Depth zestawia czysty capture galerii na iPadzie z telefonem ustawień
modułów. Daje to inny rytm niż pary telefonów i nie przycina nagłówka galerii.

## Interakcje i accessibility

Implementacja i końcowe QA potwierdzają:

- jednorazowy automat po wejściu sekcji w viewport: `0 -> 1 -> 2`;
- hover, który aktywuje wskazany ekran i zatrzymuje automat;
- click i tap, które utrzymują wybrany ekran;
- swipe powyżej progu 36 px;
- `ArrowLeft` i `ArrowRight` wraz z przeniesieniem focusu;
- `prefers-reduced-motion: reduce`, który blokuje automat;
- semantyczny `section` z lokalizowaną nazwą regionu;
- lokalizowane `aria-labelledby` i `aria-describedby` dla każdego kroku;
- `aria-pressed` bez automatycznego `aria-live` w sekcji Tasks.

Listenery klawiatury i pointera są przypięte do natywnych przycisków. Snapshot
dostępności widzi region `From voice to a delegated task`, listę trzech kroków,
pełne nazwy, opisy oraz prawidłowy stan `pressed`.

Nieaktywne podpisy pozostają czytelne na desktopie i tablecie. Na mobile są
wizualnie ukryte przez opacity, ale pozostają w drzewie dostępności i pojawiają się
po focusie. Tekst nie jest przygaszany wspólną opacity z ekranem telefonu, dzięki
czemu kontrast małego kickera i opisu spełnia WCAG AA.

## Responsywność

- Desktop - trzy płaszczyzny tworzą jedną scenę z aktywnym ekranem na pierwszym
  planie.
- Tablet - scena kompresuje się bez kolizji podpisów.
- Mobile - transformowany carousel pokazuje jeden centralny ekran i nie dodaje
  poziomego scrolla dokumentu.
- Product Depth - przy szerokości 320-390 px zestawienie iPad + telefon ma budżet
  `100vw - 72px`, odpowiadający paddingowi rozdziału i figury. Nie polega na
  ucinaniu overflow.

## Końcowe dowody renderu

Wszystkie poniższe screenshoty zostały wykonane Playwrightem z produkcyjnego
statycznego exportu finalnego diffu. Pełne strony mają szerokość PNG pomniejszoną o
pasek przewijania przeglądarki.

| Dowód | CSS viewport | PNG | Język i motyw | Stan |
| --- | ---: | ---: | --- | --- |
| [Desktop full](docs/qa/final-desktop-en-dark-full.png) | 1440 x 1100 | 1432 x 8783 | EN, Dark | pełna strona |
| [Desktop hero](docs/qa/final-desktop-en-dark-hero.png) | 1440 x 1100 | 1240 x 920 | EN, Dark | hero bez pigułek |
| [Desktop Tasks](docs/qa/final-desktop-en-dark-tasks.png) | 1440 x 1850 | 1440 x 1850 | EN, Dark | aktywny krok 03 |
| [Tablet full](docs/qa/final-tablet-en-light-full.png) | 768 x 1024 | 760 x 11075 | EN, Light | pełna strona |
| [Mobile full](docs/qa/final-mobile-pl-dark-full.png) | 390 x 844 | 382 x 12857 | PL, Dark | pełna strona |
| [Mobile Tasks 01](docs/qa/final-mobile-pl-dark-tasks.png) | 390 x 2350 | 390 x 2350 | PL, Dark | głos |
| [Mobile Tasks 03](docs/qa/final-mobile-pl-dark-tasks-active-3.png) | 390 x 2350 | 390 x 2350 | PL, Dark | gotowe zadanie |

Referencję kierunku i aktualny desktopowy render otwarto razem w jednym
porównaniu. Implementacja zachowuje przestrzenny rytm, trzy plany, skalę aktywnego
ekranu i złoty przepływ, ale każda widoczna powierzchnia produktu jest prawdziwym
UI Shuuty.

## Playwright runtime QA

1. Desktop EN Dark, 1440 x 1100:
   - automat: krok `0` przy 120 ms, `1` przy 1370 ms i `2` przy 2970 ms;
   - hover przywraca krok 01, click wybiera krok 02, `ArrowRight` wybiera krok 03
     i przenosi focus;
   - kotwica Tasks kończy poniżej stałego headera;
   - brak poziomego overflow.
2. Tablet EN Light, 768 x 1024:
   - przełącznik motywu zmienia Dark na Light;
   - wszystkie sekcje reveal stają się widoczne po scrollu;
   - 11 produktowych obrazów ładuje się poprawnie i używa wyłącznie `en-US`;
   - brak poziomego overflow.
3. Mobile PL Dark, 390 x 844:
   - tap wybiera krok 01, dwa swipy w lewo prowadzą kolejno do 02 i 03, swipe w
     prawo wraca do 02;
   - aktywny ekran realnie zmienia skalę i pozycję;
   - UI i copy pozostają wyłącznie po polsku;
   - brak poziomego overflow.
4. Wąski mobile PL Dark, 320 x 800:
   - `scrollWidth === clientWidth`;
   - po kontrolowanym lazy-load 14/14 obrazów jest kompletne i ma dodatni
     `naturalWidth`;
   - wszystkie produktowe ścieżki należą wyłącznie do `pl-PL`.
5. Reduced motion:
   - przy `matchMedia('(prefers-reduced-motion: reduce)').matches === true` krok
     pozostał na `0` przez 3.2 s po wejściu sekcji w viewport.
6. Lokalizacja:
   - przejście EN -> PL ustawia `/pl/`, `html[lang=pl]`, polski tytuł i wyłącznie
     polskie media;
   - wybrany motyw Light zachowuje się po zmianie języka.

Osobna, czysta karta Playwright zwróciła 0 błędów i 0 ostrzeżeń konsoli. Wszystkie
żądania początkowego renderu zakończyły się HTTP 200; podczas pomiaru z cache
akceptowane były również odpowiedzi 304.

## Routing i smoke test

Playwright otworzył bez 404, bez overflow i z prawidłowym tytułem oraz `lang`
wszystkie 11 tras aktualnej gałęzi:

- `/`, `/pl/`;
- `/privacy/`, `/pl/privacy/`;
- `/terms/`, `/pl/terms/`;
- `/support/`, `/pl/support/`;
- `/verify/`, `/auth/verify/`, `/auth/reset-password/`.

Trasy hand-off zachowują swój dotychczasowy uproszczony shell. Nie zostały objęte
redesignem landingu.

## Media i wydajność

- Źródła PNG: 15,382,131 B łącznie, zachowane jako kanoniczne źródła provenance.
- Serwowane WebP: 984,442 B łącznie - redukcja 93.6%.
- `en-US`: 494,680 B.
- `pl-PL`: 489,762 B.
- Największa pochodna: 160,510 B.
- Gate: maksymalnie 200 KiB na asset i 600 KiB na locale.
- Sharp 0.35.3 i libvips 8.18.3 są przypięte, a test reprodukuje wszystkie 16
  wynikowych hashy byte-for-byte.

Statyczny HTML EN zawiera wyłącznie ścieżki `en-US/*.webp`, a PL wyłącznie
`pl-PL/*.webp`. Walidator odrzuca produktowe PNG w renderze, mieszanie locale,
`exports/final`, brak pochodnej, zły MIME, hash, wymiar, encoder i przekroczenie
obu budżetów.

Laboratoryjny pomiar Playwright na lokalnym produkcyjnym exportcie, 1440 x 1100:

- TTFB 5 ms, DOMContentLoaded 23 ms, load 122 ms;
- FCP 156 ms, LCP 156 ms, element LCP `IMG`;
- CLS 0;
- jedna długa praca 69 ms;
- początkowy viewport pobiera trzy obrazy produktu o łącznym encoded body
  116,428 B.

To pomiar lokalny, nie dane terenowe RUM i nie pełny raport Lighthouse. W tej sesji
nie był dostępny Chrome DevTools trace, dlatego Core Web Vitals powinny być nadal
obserwowane po osobno zatwierdzonym wdrożeniu.

## Weryfikacja techniczna

Na finalnym lokalnym diffie przeszły:

- `npm run lint`;
- `npm run typecheck`;
- `npm test` - 11/11;
- `npm run validate:media`;
- `npm run build` - 17 statycznych stron;
- `git diff --check`.

Poprawki dla Sonar obejmują semantyczny region Tasks, listenery wyłącznie na
natywnych przyciskach oraz jawne komparatory `localeCompare` we wszystkich
zgłoszonych sortowaniach. Zdalny Quality Gate jest weryfikowany ponownie po pushu.

## Findings i ich status

- P2 contrast - naprawione.
- P2 accessible descriptions - naprawione.
- P2 interactive semantics - naprawione.
- P2 wrong group alt - naprawione.
- P2 cropped gallery - naprawione.
- P2 preview provenance - naprawione.
- P2 image weight - naprawione.
- P2 stale QA documentation - naprawione.
- P2 fresh browser visual QA - naprawione siedmioma aktualnymi capture.
- P3 derivative publication - generator waliduje wszystkie źródła i wyniki przed
  publikacją oraz używa plików tymczasowych. Awaria pomiędzy kolejnymi `rename`
  może pozostawić częściowy zestaw, który kolejna walidacja odrzuci.
- P3 export size - 15.38 MB źródłowych PNG pozostaje w paczce statycznej dla
  provenance, ale runtime ich nie żąda. To koszt artefaktu/deploymentu, nie transferu
  strony.

## Separacja PR #11

Nie zmieniono tras account deletion, aliasów legal, dokumentów ani sitemap z PR
#11. PR #11 nie jest jeszcze zintegrowany - jego trasy są nieobecne, a nie
nadpisane. `git merge-tree` nie wykazuje obecnie markerów konfliktu, ale
`scripts/validate-static-export.mjs` jest wspólnym obszarem wymagającym ręcznego
review. Podczas integracji należy zachować nowe asercje produktowe i dodać do nich
asercje account deletion oraz legacy routes z PR #11.

## Zależność od finalnego ZIP-a

`artifactBinding` pozostaje `null`. Obecne capture są owner-attested preview, nie
finalnym bindingiem sklepowym.

Po zaakceptowaniu jednego kompletnego no-publish artefaktu importer musi sprawdzić
package/run/head SHA, 50/50 plików, ledger, QA, locale, platformę, urządzenie,
pozycję, format, wymiary i każdy SHA-256. Następnie mechanicznie:

1. podmieni tylko różniące się źródła w ośmiu stabilnych slotach PL i EN;
2. zastąpi `sourceArtifactEntry` wpisami z zaakceptowanego ZIP-a;
3. uzupełni `artifactBinding` i ustawi `approved-no-publish-imported`;
4. wygeneruje deterministyczne WebP, zsynchronizuje runtime i ponowi pełne QA.

Częściowy `exports/final`, PR #9 oraz wygenerowana koncepcja pozostają zakazane
jako źródła UI.

## Werdykt

Implementacja, asset pipeline, aktualne renderowane dowody i lokalne QA przeszły
niezależny read-only review bez findingów P0-P3. Ostateczna gotowość PR zależy już
tylko od zielonego zdalnego Quality Gate na wypchniętym commicie.

final result: pending remote quality gate
