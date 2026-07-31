import type { Metadata, Viewport } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
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

export const metadata: Metadata = {
  metadataBase: new URL('https://shuuty.xyz'),
  title: {
    default: 'Shuuty - Voice Tasks, Flexible Groups & Discovery',
    template: '%s | Shuuty',
  },
  description:
    'Turn voice into delegated tasks, shape groups for collaboration, bookings, listings or offers, and discover meetings and groups nearby.',
  applicationName: 'Shuuty',
  category: 'Lifestyle',
  keywords: [
    'Shuuty',
    'voice tasks',
    'task delegation',
    'shared planner',
    'group calendar',
    'bookings',
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
  },
  openGraph: {
    title: 'Shuuty - From Idea to Action',
    description:
      'Voice tasks delivered immediately, groups for any purpose, meetings and nearby discovery in one connected app.',
    url: '/',
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['pl_PL'],
    siteName: 'Shuuty',
  },
  twitter: {
    card: 'summary',
    title: 'Shuuty - From Idea to Action',
    description:
      'Create by voice, delegate immediately, shape groups freely and discover what matters nearby.',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
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
    <html lang="en" className={`${outfit.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
