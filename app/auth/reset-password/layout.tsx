import { createNoIndexMetadata } from '@/lib/site';

export const metadata = createNoIndexMetadata({
  title: 'Reset your password',
  description: 'Choose a new password securely for your Shuuty account.',
  path: '/auth/reset-password/',
});

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
