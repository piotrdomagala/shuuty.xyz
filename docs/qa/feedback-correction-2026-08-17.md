# Feedback correction QA - 2026-08-17

## Scope

This pass addresses the visual feedback for the task, group and discovery chapters without changing product-media provenance or binding the pending store package.

1. The Tasks chapter now follows the selected site theme. In Light mode, the chapter canvas, typography, panel and dividers are light while the verified Dark product captures remain unmodified.
2. The Groups chapter uses two verified product views - the product-gallery group presentation and the group conversation list - in an editorial two-screen composition. The previous stack of generic cards and module pills was replaced with a compact use-case matrix and module line.
3. Task and discovery captures no longer receive an additional website phone frame that clipped or covered source UI edges.
4. The discovery label reserves space above both screens. The mobile bottom navigation detects cumulative fine-grained movement, hides while moving down and automatically clears after a short upward-navigation hint.
5. Product Depth keeps its accepted composition, with a smaller mobile overlap so the secondary capture stays inside the viewport.

## Browser QA

Playwright was run against the production static export at `http://127.0.0.1:4174`.

| View | Theme and locale | Result |
| --- | --- | --- |
| Desktop 1440 x 1600 | PL Light and Dark | Tasks switches theme, all three steps remain interactive, no horizontal overflow |
| Tablet 834 x 1194 | PL Light | Tasks and Groups remain readable, both real group views stay visible, no horizontal overflow |
| Mobile 390 x 844 | PL Light | Groups and Discover have no dock or caption collision, no horizontal overflow |
| Mobile 320 x 760 | PL Light | Discovery caption and screens do not overlap, no horizontal overflow |
| Desktop 1440 x 1000 | EN Light | English Tasks and Groups copy and assets load, no horizontal overflow |

Interaction and semantic checks:

- Theme button changed `data-theme`, persisted the choice and changed the Tasks chapter tokens.
- Task-step controls expose meaningful accessible names and `aria-pressed`; selection was verified for steps 2 and 3.
- Mobile navigation was hidden during downward movement, visible during upward movement and hidden automatically after 1.2 seconds.
- Three consecutive 4 px upward deltas exposed the dock; three 4 px downward deltas hid it, so trackpad-style movement is handled without waiting for one large event.
- Discovery caption-to-screen overlap check returned `false` at 390 px and 320 px.
- A 320 px `#groups` anchor left 89.27 px of clearance below the fixed header, consistent with the 92 px scroll margin.
- At 320 px, the four group use cases switch to a readable one-column list while the two product captures stay side by side.
- All images completed with non-zero intrinsic width.
- Browser console returned 0 errors and 0 warnings.
- EN and PL privacy, terms and support routes returned the expected localized title, H1, `lang` and semantic `main`.

## Visual evidence

Before and after comparisons were inspected together at the same state and viewport:

- Desktop Light Tasks: `feedback-before-desktop-pl-light-tasks.png` and `feedback-after-desktop-pl-light-tasks.png`
- Desktop Dark Tasks: `feedback-before-desktop-pl-dark-tasks.png` and `feedback-after-desktop-pl-dark-tasks.png`
- Desktop Light Groups: `feedback-before-desktop-pl-light-groups.png` and `feedback-after-desktop-pl-light-groups.png`
- Mobile Light Groups: `feedback-before-mobile-pl-light-groups-full.png`, `feedback-after-mobile-pl-light-groups.png` and `feedback-after-mobile-320-pl-light-groups.png`
- Mobile Light Discover: `feedback-before-mobile-pl-light-discover-full.png`, `feedback-before-mobile-320-pl-light-discover-full.png`, `feedback-after-mobile-pl-light-discover.png` and `feedback-after-mobile-320-pl-light-discover.png`
- Tablet Light: `feedback-after-tablet-834-pl-light-tasks.png` and `feedback-after-tablet-834-pl-light-groups.png`

All files are stored in `docs/qa/`.

## Asset boundary

No new product raster was generated or imported. This pass reuses the checked-in, manifest-verified runtime derivatives already mapped by `content/product-media.json`:

- Tasks: `voice-input`, `assignee`, `delegated-task`
- Groups: `group-offer-gallery`, `groups`
- Discover: `bookings`, `nearby`

The available task captures are verified Dark product UI only. They are intentionally preserved in both website themes rather than recolored or reconstructed. `artifactBinding` remains `null`; final package integration still depends on the approved no-publish artifact and remains a mechanical, manifest-gated replacement.
