import type { Metadata } from 'next';
import SupportPageClient from '@/components/SupportPageClient';

export const metadata: Metadata = {
  title: 'Support | Shuuty',
  description:
    'Contact Shuuty support about your account, the mobile app, or a subscription.',
};

export default function SupportPage() {
  return <SupportPageClient />;
}

