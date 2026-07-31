import type { Metadata } from 'next';
import SupportPageClient from '@/components/SupportPageClient';

const description =
  'Contact Shuuty support about your account, the mobile app, or a subscription.';

export const metadata: Metadata = {
  title: 'Support',
  description,
  alternates: { canonical: '/support/' },
  openGraph: {
    title: 'Support | Shuuty',
    description,
    url: '/support/',
  },
};

export default function SupportPage() {
  return <SupportPageClient />;
}

