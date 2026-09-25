import type { Metadata, Viewport } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import {
  APP_STORE_ID,
  createLanguageAlternates,
  GOATCOUNTER_CODE,
  SITE_URL,
  socialImage,
} from '@/lib/site';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

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
    default: 'Shuuty - Voice Tasks, Flexible Groups & Meetings',
    template: '%s | Shuuty',
  },
  description:
    'Create tasks by voice and hand them to friends or groups. Shuuty keeps reminders, chat, calendars and meetings together - on iOS and Android.',
  applicationName: 'Shuuty',
  category: 'Productivity',
  keywords: [
    'Shuuty',
    'voice tasks',
    'task delegation',
    'shared planner',
    'group calendar',
    'bookings',
    'projects and plans',
    'time tracking',
    'group galleries',
    'local offers',
    'service listings',
    'local meetings',
    'community map',
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
    title: 'Shuuty - From Idea to Action',
    description:
      'Say it, choose a person or group, and move a complete task forward. Build groups for work, community, services, sales and bookings.',
    url: '/',
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['pl_PL', 'nb_NO'],
    siteName: 'Shuuty',
    images: [socialImage('en')],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shuuty - From Idea to Action',
    description:
      'Say it. Delegate it. Get it done. Shape groups for work, community, services, sales and bookings.',
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
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jakarta.variable}`}
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
