# Analiza strony Shuuty i plan rozbudowy single-page website

**Data:** 2025-03-17 (rev. 2)  
**Zakres:** Głęboka analiza obecnej strony vs. aplikacja mobilna + plan rozbudowy  
**Motyw kolorystyczny:** CZARNY + ŻÓŁTY/GOLD (#FFE5A0)

---

## 1. Stan obecny strony (Shuuty APP)

### 1.1 Technologia
- **Framework:** Next.js 14 (App Router)
- **Styling:** CSS Modules + CSS Custom Properties
- **Fonty:** Outfit (display), Plus Jakarta Sans (body)
- **Eksport:** Static export (`output: 'export'`) – GitHub Pages / Netlify / Vercel
- **Języki:** EN/PL (js-cookie)

### 1.2 Struktura stron
| Ścieżka | Opis |
|---------|------|
| `/` | Landing – hero z 2 screenshots (desktop) / carousel (mobile), store buttons |
| `/verify` | Deep link email verification (`shuuty://auth/verify?token=...`) |
| `/auth/verify` | Alternatywna weryfikacja |
| `/support` | Formularz kontaktowy (SYMULOWANY – brak backendu!) |
| `/privacy` | Polityka prywatności (markdown z pliku) |
| `/terms` | Regulamin (markdown z pliku) |

### 1.3 Co jest na landing page (obecny stan)
Jedna sekcja hero:
- Tytuł: „Find Those You Seek"
- Opis 1–2 zdania
- 2 screenshots (desktop) / carousel 5 screenshots (mobile)
- Przyciski Google Play + App Store
- Footer: copyright + Support / Privacy / Terms

**To jest za mało.** Użytkownik nie dowiaduje się czym jest Shuuty, co robi, dla kogo.

### 1.4 Obecny design system (ZŁY – nie pasuje do aplikacji)
- Strona: fiolet (#667eea), złoto (#ffe5a0), niebieski (#7dd3fc), białe tło
- Aplikacja dark: czerń (#0D1117), cream gold (#FFE5A0), niebieski (#7DD3FC)
- **Rozbieżność jest duża** – użytkownik nie rozpozna aplikacji po stronie

---

## 2. Co oferuje aplikacja mobilna (S-)

### 2.1 Funkcje
| Moduł | Opis |
|-------|------|
| **Tasks** | Zadania z delegowaniem, timerem, głosowym tworzeniem, checklistami, galerią, lokalizacją |
| **Meetings** | Spotkania – aktywność, miejsce, czas, uczestnicy, cover, zaproszenia |
| **Groups** | Grupy tematyczne – członkowie, chat, zadania grupowe |
| **Map** | Mapa spotkań i grup w okolicy |
| **Friends** | Znajomi, zaproszenia, wysłane |
| **Profile** | Profil, subskrypcje (Free/Pro/Teams) |
| **Voice** | Głosowe tworzenie zadań (rozpoznawanie mowy) |
| **Chat** | Wiadomości w spotkaniach/grupach |

### 2.2 Bottom Tabs
1. Home (dashboard – zadania, spotkania, powiadomienia)
2. Map (mapa w okolicy)
3. + (centralne CTA – tworzenie spotkania)
4. Your Manager (Twoje spotkania i grupy)
5. Profile

### 2.3 Branding aplikacji – Dark Theme (DOCELOWY STYL STRONY)

```
Tło:              #0D1117  (głęboka czerń)
Tekst:            #FFFFFF
Secondary bg:     #161B22
Elevated bg:      #21262D
Border:           #30363D
Text muted:       #8B949E
Text faded:       #484F58

Gradient accent:  #FFE5A0 (cream gold) → #7DD3FC (light blue)
Button text:      #FFE5A0
Gold premium:     #FFE5A0

Glass bg:         rgba(22, 27, 34, 0.75)
Glass border:     rgba(255, 255, 255, 0.1)
Gold glow:        rgba(255, 229, 160, 0.25)
Blue glow:        rgba(125, 211, 252, 0.25)
```

### 2.4 Kluczowe elementy UI z kodu

**`BorderButton.tsx`** – gradient border (focused state):
```
colors: ['#FFE5A0', '#7DD3FC']  ← TE OBRAMÓWKI!
borderWidth: 2, borderRadius: 99
```

**`GlassButton.tsx`** – glass morphism + gradient:
```
variant: 'glass' | 'gradient' | 'outline'
blur(12), rgba(22,27,34,0.75) bg, rgba(255,255,255,0.15) border
```

**`StartScreen.tsx`** – ambient atmosphere:
```
Breathing gold glow layers: rgba(255, 229, 160, ...)
CTA shimmer: rgba(255, 229, 160, 0.12)
Gradient accent line: [buttonGradientStartColor, buttonGradientEndColor]
```

---

## 3. Docelowy design system strony: CZARNY + ŻÓŁTY/GOLD

### 3.1 Paleta CSS

```css
:root {
  /* ═══ GŁÓWNE TŁO ═══ */
  --color-bg-primary:    #0D1117;
  --color-bg-secondary:  #161B22;
  --color-bg-elevated:   #21262D;

  /* ═══ TEKST ═══ */
  --color-text-primary:  #FFFFFF;
  --color-text-secondary: #8B949E;
  --color-text-muted:    #484F58;

  /* ═══ AKCENTY (Z PRZYCISKÓW APLIKACJI) ═══ */
  --color-accent-gold:   #FFE5A0;
  --color-accent-blue:   #7DD3FC;
  --color-accent-gold-dark: #FFD080;

  /* ═══ BORDER ═══ */
  --border-default:      #30363D;
  --border-subtle:       rgba(255, 255, 255, 0.06);

  /* ═══ GLASS MORPHISM ═══ */
  --glass-bg:            rgba(22, 27, 34, 0.75);
  --glass-border:        rgba(255, 255, 255, 0.1);
  --glass-glow-gold:     rgba(255, 229, 160, 0.25);
  --glass-glow-blue:     rgba(125, 211, 252, 0.25);

  /* ═══ STATUS ═══ */
  --color-success:       #34D399;
  --color-warning:       #FBBF24;
  --color-error:         #F87171;
}
```

### 3.2 Styl wizualny
- **Tło:** #0D1117 (NIE czysty #000000)
- **Karty:** glass morphism – `backdrop-filter: blur(12px)`, border rgba white 10%
- **CTA buttons:** gradient border gold→blue (jak BorderButton focused)
- **Hover:** box-shadow z gold glow
- **Gradient text:** `background-clip: text` (gold→blue) na tytułach
- **Ambient glow:** pulsujące radial-gradient blobs (gold + blue, jak AmbientAtmosphere)
- **Accent line:** gradient gold→blue pod elementami (jak pod logo w StartScreen)

---

## 4. Architektura sekcji

```
┌──────────────────────────────────────────────────────────────────┐
│ NAVBAR (sticky, glass bg)                                         │
│  Logo │ Features │ How it works │ Download   │ 🌐 EN/PL          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 1. HERO  (black bg + ambient gold/blue glow)                      │
│                                                                    │
│    „From idea to action"  ← gradient text (gold → blue)            │
│    Opis: 2–3 zdania                                               │
│    [App Store]  [Google Play]  ← gradient border buttons          │
│    📱 Mockup telefonu z glow                                      │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 2. FEATURES  (4 glass cards, gold left-border accent)             │
│    🎯 Tasks    🤝 Meetings    👥 Groups    🗺️ Map                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 3. HOW IT WORKS  (3 kroki + gradient gold→blue connector line)    │
│    ① Wybierz zainteresowania → ② Znajdź ludzi → ③ Działaj       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 4. SCREENSHOT SHOWCASE  (alternating: tekst + screenshot)         │
│    Duży screenshot z opisem po boku, gold glow/shadow             │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 5. FAQ  (accordion, glass cards, gradient bottom-border)          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 6. FINAL CTA  (radial gold+blue glow bg)                         │
│    „Gotowy na działanie?"  [App Store]  [Google Play]             │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ FOOTER  (dark, minimal)                                           │
│  © 2025 Shuuty │ Support │ Privacy │ Terms                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Ulepszenia techniczne

| Obszar | Rekomendacja |
|--------|--------------|
| **Kolory** | Czerń #0D1117 + gold #FFE5A0 + blue #7DD3FC |
| **Glass** | `backdrop-filter: blur(12px)` + border rgba(255,255,255,0.1) |
| **Scroll animations** | Intersection Observer – fade-in-up sekcji |
| **Ambient glow** | CSS radial-gradient pulsujący (keyframes) |
| **Gradient text** | `background-clip: text` na tytułach |
| **Gradient borders** | Pseudo-element + gradient (jak BorderButton) |
| **Smooth scroll** | `scroll-behavior: smooth` + anchor links |
| **SEO** | Structured data (SoftwareApplication), OG tags |
| **Support** | Formspree / mailto zamiast symulacji |

---

## 6. Priorytety wdrożenia

### Faza 1 (pełna przebudowa)
1. Design system globals.css – czarny + gold + glass
2. Layout.tsx – metadata, opcjonalnie DM Sans
3. Hero – gradient text, ambient glow, mockup, store buttons
4. Features (4 glass cards)
5. How it works (3 kroki)
6. Screenshot showcase (z opisami)
7. FAQ accordion
8. Final CTA + footer
9. Responsive mobile-first

### Faza 2 (polish)
10. Scroll animations (Intersection Observer)
11. Navbar z anchor links
12. Ambient glow animations
13. Gradient border hover effects
14. Support – Formspree/mailto

### Faza 3 (opcjonalnie)
15. Pricing (Free/Pro/Teams)
16. Video demo
17. Newsletter
18. Testimonials

---

## 7. Pliki do modyfikacji

| Plik | Zmiany |
|------|--------|
| `app/globals.css` | PEŁNA ZMIANA – czarny + gold design system |
| `app/page.tsx` | PEŁNA PRZEBUDOWA – 6+ sekcji zamiast 1 |
| `app/page.module.css` | PEŁNA PRZEBUDOWA – style nowych sekcji |
| `app/layout.tsx` | Metadata, opcjonalnie DM Sans |
| `components/` | Nowe: FeatureCard, HowItWorks, FAQ, ScreenshotShowcase, Navbar |
| `app/support/page.tsx` | Dostosowanie kolorów + realna integracja |
| `app/privacy/page.tsx` | Dostosowanie kolorów |
| `app/terms/page.tsx` | Dostosowanie kolorów |
| `app/documents.module.css` | Ciemny motyw |
| `app/verify/page.module.css` | Ciemny motyw |

---

## 8. Podsumowanie

**Problem:** Obecna strona to minimalistyczny biały landing z fioletowymi akcentami – kompletnie nie pasuje do aplikacji.

**Rozwiązanie:** Pełna przebudowa na dark single-page website:
- Tło: **#0D1117** (czerń z aplikacji)
- Akcent: **#FFE5A0** (cream gold / żółty – jak obramówki przycisków w dark mode)
- Drugi akcent: **#7DD3FC** (niebieski – gradient endpoint)
- Glass morphism na kartach
- Gradient borders gold→blue
- 6+ sekcji: Hero, Features, How it works, Screenshots, FAQ, CTA
- Ambient glow (jak AmbientAtmosphere w StartScreen)

**Technologia:** Next.js 14, CSS Modules, static export – bez zmian stacka.

---

*Źródła: `colors.ts` (darkThemeColors), `BorderButton.tsx`, `GlassButton.tsx`, `StartScreen.tsx`, `i18n/en.json`*
