import { createLegacyAliasMetadata } from '@/lib/site';

export const metadata = createLegacyAliasMetadata({
  title: 'Support',
  description: 'Legacy address for Shuuty support.',
  canonicalPath: '/support/',
  englishCanonicalPath: '/support/',
  polishCanonicalPath: '/pl/support/',
});

export { default } from '@/app/support/page';
