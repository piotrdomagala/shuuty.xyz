import { createLegacyAliasMetadata } from '@/lib/site';

export const metadata = createLegacyAliasMetadata({
  title: 'Terms and Conditions',
  description: 'Legacy address for the Shuuty Terms and Conditions.',
  canonicalPath: '/terms/',
  englishCanonicalPath: '/terms/',
  polishCanonicalPath: '/pl/terms/',
});

export { default } from '@/app/terms/page';
