import SupportPageClient from '@/components/SupportPageClient';
import { createPublicPageMetadata } from '@/lib/site';

const description =
  'Contact Shuuty support about your account, the mobile app, or a subscription.';

export const metadata = createPublicPageMetadata({
  title: 'Support',
  description,
  path: '/support/',
});

export default function SupportPage() {
  return <SupportPageClient />;
}

