import { createNoIndexMetadata } from '@/lib/site';

export const metadata = createNoIndexMetadata({
  title: 'Verify your email',
  description: 'Complete email verification securely in the Shuuty mobile app.',
  path: '/auth/verify/',
});

export default function AuthVerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
