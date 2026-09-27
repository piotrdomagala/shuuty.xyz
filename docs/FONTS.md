# Fonts

The site uses two fonts, both under the SIL Open Font License 1.1:

| Font | Used for | CSS variable (`app/globals.css`) | Weights |
| --- | --- | --- | --- |
| Outfit | headings, brand | `--font-display` | 400, 500, 600, 700, 800 |
| Plus Jakarta Sans | body text | `--font-body` | 400, 500, 600, 700 |

They are self-hosted, so `npm run build` needs no network access to Google Fonts.

## Files

- `public/fonts/*.woff2` - one file per font and Unicode subset. They are the exact files `next/font/google` downloaded for the live site until 2026-09-27 (byte-identical to the `/_next/static/media/` files served then). `content/fonts.json` lists each file with its size and sha256.
- `public/fonts/OFL-*.txt` - the license of each font, from the `google/fonts` repository. The OFL requires it to travel with the files.
- `app/fonts.css` - the `@font-face` rules `next/font/google` generated: same files, weights, `unicode-range`, `font-display: swap` and order. A browser downloads a file only when the page has characters in its range; Polish letters use the latin-ext files, Norwegian æøå the latin ones.
- `app/layout.tsx` preloads the latin and latin-ext files of both fonts on every page, as before. The cyrillic-ext and vietnamese files of Plus Jakarta Sans are never preloaded and never needed by the current pages.

`next/font/local` is not used: it applies the same descriptors to every file of a font, so it cannot give each subset file its own `unicode-range`, and the metric-adjusted fallback faces it generates were not in effect anyway (`app/globals.css` sets the font variables with system fallbacks).

## Checks

- `scripts/fonts.test.mjs` - every file matches `content/fonts.json` byte for byte, the licenses are present, `app/fonts.css` covers every weight in latin and latin-ext, Polish and Norwegian letters fall in the ranges, and the layout imports nothing from Google Fonts.
- `scripts/validate-static-export.mjs` - every checked page preloads the four files, every font file is exported, and no exported HTML, CSS or JS refers to Google Fonts.

## Changing a font

Replace the files and the rules together, update `content/fonts.json` (sizes and sha256) and the license files, and compare pages before and after in both themes.
