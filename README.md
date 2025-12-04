# Shuuty - Find Those You Seek

Modern landing page and verification system for the Shuuty mobile application.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules with CSS Custom Properties
- **Fonts**: Outfit & Plus Jakarta Sans (Google Fonts)

## Features

### Landing Page (`/`)
- Stunning animated hero section with floating background shapes
- App screenshots carousel with smooth animations
- Multi-language support (English/Polish) with cookie persistence
- Download links for iOS App Store and Google Play Store
- Fully responsive design (mobile-first)

### Verification Page (`/verify`)
- Deep link handling for email verification
- Automatic app opening via `shuuty://` protocol
- Fallback UI with store download links
- Beautiful light mode design with gradient accents

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

Static export will be generated in the `out/` directory.

### Preview Production Build

```bash
npm run start
```

## Project Structure

```
/app
  /layout.tsx        - Root layout with fonts and metadata
  /page.tsx          - Landing page component
  /page.module.css   - Landing page styles
  /globals.css       - Global styles and CSS variables
  /verify
    /page.tsx        - Email verification page
    /page.module.css - Verification page styles
/public
  /images            - App screenshots and icons
  /documents         - Legal documents (Privacy, Terms, Support)
```

## Design System

### Colors
- Primary Background: `#ffffff`
- Accent: `#667eea` (Purple-Blue)
- Success: `#34d399`
- Gold: `#ffe5a0`
- Sky: `#7dd3fc`

### Typography
- Display: Outfit
- Body: Plus Jakarta Sans

## Deployment

This project is configured for static export, compatible with:
- GitHub Pages
- Vercel
- Netlify
- Any static hosting

## License

© 2025 Shuuty. All rights reserved.
