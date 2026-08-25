import { createLegacyAliasMetadata } from '@/lib/site';

export const metadata = createLegacyAliasMetadata({
  title: 'Wsparcie',
  description: 'Starszy adres wsparcia Shuuty.',
  canonicalPath: '/pl/support/',
  englishCanonicalPath: '/support/',
  polishCanonicalPath: '/pl/support/',
});

export { default } from '@/app/pl/support/page';
