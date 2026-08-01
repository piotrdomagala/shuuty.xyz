# Design QA

## Source and target

- Source: current production at `https://shuuty.xyz/` plus the mobile screenshots supplied by the user.
- Target: local Next.js preview at `http://127.0.0.1:3000/`.
- Browser: local Microsoft Edge in headless mode, explicitly approved by the user.
- Comparison captures: source and local screenshots were paired side by side at identical viewport, theme, language, route, and scroll position.

## Viewport and state matrix

| Area | Viewports | States checked |
| --- | --- | --- |
| Landing hero | 320×700, 360×800, 441×932, 720×900, 721×900, 1440×1000 | light, dark, EN; phone labels hidden through 720 px |
| Groups visual | 390×844, 441×932 | light, dark, EN; sticky header; phone layered behind cards |
| Privacy | 320×700, 360×800, 390×844 | light, dark, EN, PL |
| Terms | 390×844, 714×900 | light, dark, EN, PL |
| Support | 360×800, 390×844, 1440×1000 | light, dark, EN, PL |

## Findings and fixes

| Severity | Finding | Resolution |
| --- | --- | --- |
| P1 | Tasks, Groups, and Meetings orbit badges appeared beside the hero phones on phone-sized layouts. | Hidden at widths up to 720 px while preserving the three phone mockups. |
| P1 | The groups label crossed the phone image with insufficient contrast. | Added an opaque, theme-aware label surface with a restrained border and shadow. |
| P1 | Privacy, Terms, and Support had weak light-theme title contrast and inconsistent shared headers. | Rebuilt the shared chrome around the existing design tokens, app icon, responsive actions, and working theme toggle. |
| P1 | Legal pages emitted two `h1` elements. | Kept the document title as the single page `h1`; the chrome title is now a non-heading label. |
| P2 | Purple glow and animated gradient borders competed with the content. | Replaced them with neutral token-based surfaces and borders in both themes. |
| P2 | Mobile legal headers could become cramped with longer Polish labels. | Verified wrapped titles and controls at 320–390 px without overlap or horizontal overflow. |

## Interaction and runtime checks

- Theme control changed `data-theme`, `color-scheme`, theme color, and persisted `shuuty-theme` in local storage.
- Language control changed content, `html[lang]`, pressed state, and the `lang` cookie between EN and PL.
- Landing and document captures reported no console errors or uncaught runtime exceptions.
- `body.scrollWidth` did not exceed the viewport across the matrix.
- App store links, document routes, footer navigation, canonical paths, and the support mail action remain present in the static export.

## Comparison outcome

- Hero comparison confirms that phone imagery remains unchanged while the mobile orbit badges are removed.
- Groups comparison confirms that the phone remains behind the cards and the overlay label is legible in light and dark themes.
- Privacy, Terms, and Support comparisons confirm neutral borders, readable titles, and consistent responsive headers.

final result: passed
