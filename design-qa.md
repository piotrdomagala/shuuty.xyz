# Design QA - spatial task handoff

## Zakres i źródło prawdy

- Zakres tej iteracji: sekcja `01 Tasks` / `01 Zadania`, realne media produktu oraz
  zróżnicowanie sekcji Product Depth w istniejącym landingu.
- Wybrany kierunek wizualny: wariant 3 - przestrzenne przekazanie zadania.
- Hero zachowuje zaakceptowaną płynną karuzelę, ale nie nakłada pigułek na UI.
- Referencja kompozycji:
  `C:\Users\piotr\.codex\generated_images\01a00bba-e0a8-7631-b549-4b31f76c0d8c\exec-e3c8a91f-f42f-40e5-bcbd-c2b3a1246ffb.png`.
  Ma 1435 x 1096 px i służy wyłącznie do oceny rytmu, perspektywy i skali. Nie
  jest częścią builda, ponieważ zawiera wygenerowane UI.
- Źródłem prawdziwego UI jest 16 kanonicznych capture PL/EN z
  `piotrdomagala/S-` na commicie
  `20a14889e2397514b7c7bcd73269508f24c8004f`.
- Golden Relay jest dokładną kopią
  `store-listing/assets/brand/golden-relay-transparent-2048x256.png`, SHA-256
  `4e49a0b5b2f07f5cb934321d573173463e5ab10d986c29acf64593548956ce15`.

Kanoniczne PNG pozostają byte-for-byte źródłami provenance. Strona renderuje ich
deterministyczne, półskalowe pochodne WebP. Każda pochodna ma zapisany osobny hash,
rozmiar, `sourceSha256`, encoder i wersję libvips. Runtime nie ma fallbacku do PNG.

## Wybrana kompozycja

Sekcja Tasks używa trzech realnych ekranów jako jednej sekwencji:

1. Capture - `Say it.` / `Powiedz.`
2. Context - `Choose a person or group.` / `Wybierz osobę lub grupę.`
3. Hand-off - `Delegate now. The task is ready.` / `Deleguj teraz. Zadanie jest gotowe.`

Aktywny ekran rośnie, rozjaśnia się i wychodzi do przodu. Pozostałe ekrany
zachowują kontekst, ale nie konkurują z aktywnym. Prawdziwy Golden Relay łączy
sekwencję poza warstwą interfejsu produktu.

Product Depth zestawia czysty capture galerii na iPadzie z telefonem ustawień
modułów. To wprowadza inny rytm niż wcześniejsze pary telefonów i rozwiązuje wadę
przyciętego nagłówka w telefonicznym capture galerii.

## Interakcje i accessibility

Implementacja obsługuje:

- jednorazowy automat po wejściu sekcji w viewport: `0 -> 1 -> 2`;
- hover, który aktywuje wskazany ekran i zatrzymuje automat;
- click i tap, które utrzymują wybrany ekran;
- swipe powyżej progu 36 px;
- `ArrowLeft` i `ArrowRight` wraz z przeniesieniem focusu;
- `prefers-reduced-motion: reduce`, który blokuje automat;
- lokalizowane `aria-labelledby` i `aria-describedby` dla każdego kroku;
- `aria-pressed` bez automatycznego `aria-live`.

Nieaktywne podpisy pozostają czytelne na desktopie i tablecie. Na mobile są
wizualnie ukryte przez opacity, ale pozostają w drzewie dostępności i pojawiają się
po focusie. Tekst nie jest przygaszany wspólną opacity z ekranem telefonu, dzięki
czemu kontrast małego kickera i opisu spełnia WCAG AA.

## Responsywność

- Desktop - trzy płaszczyzny tworzą jedną scenę z aktywnym ekranem na pierwszym
  planie.
- Tablet - scena kompresuje się bez kolizji podpisów.
- Mobile - transformowany carousel pokazuje jeden centralny ekran i nie używa
  poziomego scrolla dokumentu.
- Product Depth - przy szerokości 320-390 px zestawienie iPad + telefon ma dokładnie
  budżet `100vw - 72px`, odpowiadający paddingowi rozdziału i figury. Nie polega na
  ucinaniu overflow.

## Dowody renderu

Pierwszy produkcyjny render kierunku 3 został zapisany w trzech viewportach:

| Widok | CSS viewport | Screenshot sekcji | Język i motyw | Stan |
| --- | ---: | ---: | --- | --- |
| Desktop | 1440 x 1100 | 1180 x 1430 px | EN, Dark | krok 02 |
| Tablet | 768 x 1024 | 704 x 1532 px | EN, Dark | krok 02 |
| Mobile | 390 x 844 | 354 x 1910 px | PL, Dark | krok 02 |

- [Desktop EN Dark](docs/qa/task-flow-v3-desktop-en-dark.png)
- [Tablet EN Dark](docs/qa/task-flow-v3-tablet-en-dark.png)
- [Mobile PL Dark](docs/qa/task-flow-v3-mobile-pl-dark.png)

Referencję kierunku i desktopowy render otwarto razem w jednym porównaniu. Układ
zachowuje przestrzenny rytm referencji, ale wszystkie widoczne ekrany zastępuje
prawdziwym UI Shuuty.

Te trzy screenshoty poprzedzają końcowe zwiększenie kontrastu podpisów, przejście
runtime na WebP oraz zestawienie iPad + telefon. Geometria samej sekcji Tasks nie
zmieniła się, ale screenshoty nie są traktowane jako końcowy dowód zamrożonego
diffu. Świeży browser capture jest nadal wymagany.

## Media i wydajność

- Źródła PNG: 15,382,131 B łącznie, zachowane wyłącznie jako kanoniczne źródła.
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

## Weryfikacja techniczna

Na zamrożonym diffie drugiego review przeszły:

- `npm run lint`;
- `npm run typecheck`;
- `npm test` - 11/11;
- `npm run validate:media`;
- `npm run build` - 17 statycznych stron;
- `git diff --check HEAD`.

Static export zachowuje 11 istniejących tras strony i ma po jednym `h1`, poprawne
`lang`, canonical i locale alternates. Jedynym ostrzeżeniem builda jest nieaktualna
baza `caniuse-lite`.

Pierwsze browser QA przed końcowymi poprawkami potwierdziło auto, hover, click,
tap, swipe, klawiaturę, reduced motion, brak overflow, 14/14 załadowanych obrazów,
0 błędów i 0 ostrzeżeń konsoli. Aktualna powierzchnia Browser nie udostępniła
żadnego okna, dlatego po końcowych poprawkach nie wykonano jeszcze ponownego live QA.

## Findings i ich status

- P2 contrast - naprawione. Tekst i ekran mają osobne poziomy przygaszenia.
- P2 accessible descriptions - naprawione przez `aria-labelledby` i
  `aria-describedby`.
- P2 wrong group alt - naprawione; opis odpowiada ekranowi Chat/Czat.
- P2 cropped gallery - naprawione czystym capture iPada EN/PL.
- P2 preview provenance - naprawione przez schema 2 i wspólne invariants dla
  preview oraz bound package.
- P2 image weight - naprawione deterministycznymi WebP oraz twardymi budżetami.
- P2 stale QA documentation - naprawione w tym dokumencie.
- P2 fresh browser visual QA - otwarte do czasu aktualnego capture.
- P3 derivative publication - generator waliduje wszystkie źródła i wyniki przed
  publikacją oraz używa plików tymczasowych. Awaria pomiędzy kolejnymi `rename`
  może pozostawić częściowy zestaw, który kolejna walidacja odrzuci.

## Separacja PR #11

Nie zmieniono tras account deletion, aliasów legal, dokumentów ani sitemap z PR
#11. Późniejsza integracja ma jeden mechaniczny konflikt w
`scripts/validate-static-export.mjs`; należy połączyć nowe asercje produktowe z
asercjami account deletion i legacy routes.

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

## Niezależny review

Drugi review potwierdził naprawę wszystkich sześciu findingów implementacyjnych.
Kod i pipeline assetów są technicznie gotowe. Finalny werdykt PR pozostaje
`NOT READY` wyłącznie do czasu świeżego browser visual QA zamrożonego diffu.

final result: pending fresh browser visual QA
