# Design QA

## Źródło i implementacja

- Źródło wizualne: bieżąca produkcja `https://shuuty.com/` oraz mobilne zrzuty ekranu przekazane przez użytkownika (w tym Samsung Galaxy S23 Ultra).
- Implementacja: czysty eksport produkcyjny Next.js serwowany lokalnie z katalogu `out`.
- Przeglądarka: lokalny Microsoft Edge w trybie headless, zgodnie z wyborem użytkownika.
- Porównanie: produkcja i implementacja zostały zestawione obok siebie przy tym samym viewportcie 489×932, języku EN, jasnym motywie i pozycji strony.

## Macierz widoków i stanów

| Obszar | Viewporty | Sprawdzone stany | Wynik |
| --- | --- | --- | --- |
| Landing i hero | 320, 360, 384, 412, 720, 1440 px | EN/PL, light/dark, brak poziomego overflow | PASS |
| Karuzela trzech telefonów | 320, 360, 384, 412, 720, 1440 px | klik, klawiatura, swipe, wskaźniki aktywnego slajdu | PASS |
| Sekcja grup | 360, 412, 489 px | telefon za kafelkami, light/dark, czytelny tekst | PASS |
| Privacy | 320, 360, 412, 720, 1440 px | EN/PL, light/dark, header, powrót, canonical/hreflang | PASS |
| Terms | 320, 360, 412, 720, 1440 px | EN/PL, light/dark, header, powrót, canonical/hreflang | PASS |

## Ustalenia i poprawki

| Priorytet | Ustalenie | Rozwiązanie |
| --- | --- | --- |
| P1 | Mobilne etykiety Tasks, Groups i Meetings zasłaniały telefony. | Ukryto etykiety do 720 px, pozostawiając wszystkie trzy obrazy telefonów. |
| P1 | Na jasnym motywie pod telefonami był widoczny podział koloru tła. | Ujednolicono tło hero i przejście do następnej sekcji; końcowy zrzut nie pokazuje szwu. |
| P1 | Obrazy telefonów były statyczne. | Dodano dostępną karuzelę obsługiwaną kliknięciem, strzałkami, dotykiem i trzema wskaźnikami o polu 44×44 px. |
| P1 | Minimalna szerokość `body` powodowała kilka pikseli overflow przy dokładnie 320 px w Edge. | Usunięto sztywną minimalną szerokość i zastosowano `overflow-x: clip`. |
| P1 | Privacy i Terms miały niespójny header i słaby kontrast w jasnym motywie. | Ujednolicono chrome dokumentów, kolory, obramowania, motyw i przełącznik języka. |
| P2 | Polski eksport statyczny zachowywał `lang="en"`. | Postbuild ustawia `lang="pl"` dla wszystkich polskich tras i walidator pilnuje regresji. |

## Interakcje i runtime

- Każdy z trzech telefonów może zostać wysunięty na pierwszy plan; aktywny slajd jest zsynchronizowany z `aria-pressed` i komunikatem `aria-live`.
- Strzałki lewo/prawo i swipe obracają karuzelę bez poziomego przewijania strony; `touch-action` zachowuje pionowy scroll i pinch zoom.
- Przy szerokościach 320–1440 px obrazy mieszczą się w poziomych granicach viewportu, a strony nie generują poziomego overflow.
- Przełączniki light/dark oraz EN/PL działają na landing page, Privacy i Terms; zmieniają trasę, `html[lang]`, stan przycisków i zapisaną preferencję.
- Końcowy test Edge nie wykazał wyjątków JavaScript ani błędów runtime.
- Czysty build wygenerował 17 tras statycznych i przeszedł walidację dokumentów prawnych oraz eksportu.

## Wynik porównania

- Trzy mockupy pozostają w pełni widoczne i nie są zasłonięte mobilnymi pigułkami.
- Jasne tło jest spójne od przycisków sklepów do sekcji „One connected ecosystem”.
- Telefon w sekcji grup pozostaje za kafelkami, a tekst ma czytelną powierzchnię w obu motywach.
- Privacy i Terms mają spójny, responsywny header i poprawne warianty językowe.

Final result: **PASS**
