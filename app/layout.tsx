import type { Metadata, Viewport } from 'next';
import { preload } from 'react-dom';
import {
  APP_STORE_ID,
  createLanguageAlternates,
  GOATCOUNTER_CODE,
  SITE_URL,
  socialImage,
} from '@/lib/site';
import './fonts.css';
import './globals.css';

// The latin and latin-ext files of both fonts, preloaded on every page as
// next/font/google did; cyrillic-ext and vietnamese load only if a page needs them.
const PRELOADED_FONTS = [
  '/fonts/outfit-latin.woff2',
  '/fonts/outfit-latin-ext.woff2',
  '/fonts/plus-jakarta-sans-latin.woff2',
  '/fonts/plus-jakarta-sans-latin-ext.woff2',
] as const;

const themeScript = `
  (function () {
    var theme = 'dark';
    var path = window.location.pathname;
    document.documentElement.lang = path === '/pl' || path.indexOf('/pl/') === 0
      ? 'pl'
      : path === '/nb' || path.indexOf('/nb/') === 0 ? 'nb' : 'en';
    try {
      var stored = window.localStorage.getItem('shuuty-theme');
      if (stored === 'light' || stored === 'dark') {
        theme = stored;
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        theme = 'light';
      }
    } catch (_) {}
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    var syncThemeColor = function () {
      var color = theme === 'light' ? '#FFFBF5' : '#0D1117';
      document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
        meta.setAttribute('content', color);
      });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', syncThemeColor, { once: true });
    } else {
      syncThemeColor();
    }
  })();
`;

const goatCounterSettingsScript = `
  window.goatcounter = {
    no_onload: /^\\/(?:verify|auth)(?:\\/|$)/.test(window.location.pathname),
  };
`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Shuuty - tasks, plans and reservations with friends and groups',
    template: '%s | Shuuty',
  },
  description:
    'A to-do list, tasks for friends and groups with a calendar, bookings and meetings nearby. Start with your own tasks. For iOS and Android.',
  applicationName: 'Shuuty',
  category: 'Productivity',
  // Public site-ownership tag from Bing Webmaster Tools; it is meant to be visible.
  verification: {
    other: { 'msvalidate.01': '46DDA7EE77C302D25066B78BD86697EB' },
  },
  keywords: [
    'Shuuty',
    'task app',
    'to-do list with subtasks',
    'tasks for friends',
    'shared tasks',
    'group tasks',
    'group calendar',
    'bookings',
    'meetings nearby',
    'voice tasks',
    'mobile app',
  ],
  authors: [{ name: 'Shuuty' }],
  creator: 'Shuuty',
  publisher: 'Shuuty',
  alternates: {
    canonical: '/',
    languages: createLanguageAlternates('/', '/pl/', '/nb/'),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'Shuuty - tasks, plans and reservations with friends and groups',
    description:
      'Start with your own to-do list, hand tasks to friends and join groups and meetings of people who share your interests.',
    url: '/',
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['pl_PL', 'nb_NO'],
    siteName: 'Shuuty',
    images: [socialImage('en')],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shuuty - tasks, plans and reservations with friends and groups',
    description:
      'Start with your own to-do list, hand tasks to friends and join groups and meetings of people who share your interests.',
    images: [{ url: socialImage('en').url, alt: socialImage('en').alt }],
  },
  icons: {
    icon: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  itunes: {
    appId: APP_STORE_ID,
  },
  appleWebApp: {
    capable: true,
    title: 'Shuuty',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFBF5' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1117' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  for (const href of PRELOADED_FONTS) {
    preload(href, { as: 'font', type: 'font/woff2', crossOrigin: '' });
  }

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {GOATCOUNTER_CODE ? (
          <>
            {/* Hand-off routes carry one-time tokens in the URL; never count them. */}
            <script dangerouslySetInnerHTML={{ __html: goatCounterSettingsScript }} />
            <script
              data-goatcounter={`https://${GOATCOUNTER_CODE}.goatcounter.com/count`}
              async
              src="https://gc.zgo.at/count.js"
            />
          </>
        ) : null}
      </head>
      <body>{children}</body>
    </html>
  );
}
