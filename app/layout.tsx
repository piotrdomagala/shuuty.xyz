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

export const metadata: Metadata = {
  title: 'Shuuty — From Idea to Action',
  description:
    'Arrange activities wherever you are. Meet people who share your interests, plan meetings, delegate tasks, and make things happen.',
  keywords: [
    'shuuty',
    'social',
    'activities',
    'meet people',
    'events',
    'tasks',
    'meetings',
    'groups',
    'mobile app',
  ],
  authors: [{ name: 'Shuuty' }],
  openGraph: {
    title: 'Shuuty — From Idea to Action',
    description:
      'Meet people who share your interests and plan your time like never before.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Shuuty',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shuuty — From Idea to Action',
    description:
      'Meet people who share your interests and plan your time like never before.',
  },
  icons: {
    icon: '/images/shuuty_icon.webp',
    apple: '/images/shuuty_icon.webp',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0D1117',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
