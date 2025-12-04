import type { Metadata, Viewport } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Shuuty - Find Those You Seek',
  description: 'Arrange activities wherever you are. Meet new people similar to you and plan your time like never before.',
  keywords: ['shuuty', 'social', 'activities', 'meet people', 'events', 'mobile app'],
  authors: [{ name: 'Shuuty' }],
  openGraph: {
    title: 'Shuuty - Find Those You Seek',
    description: 'Arrange activities wherever you are. Meet new people similar to you and plan your time like never before.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Shuuty',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shuuty - Find Those You Seek',
    description: 'Arrange activities wherever you are. Meet new people similar to you.',
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
  themeColor: '#667eea',
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

