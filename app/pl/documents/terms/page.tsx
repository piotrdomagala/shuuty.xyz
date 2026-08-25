import { createLegacyAliasMetadata } from '@/lib/site';

export const metadata = createLegacyAliasMetadata({
  title: 'Regulamin',
  description: 'Starszy adres Regulaminu Shuuty.',
  canonicalPath: '/pl/terms/',
  englishCanonicalPath: '/terms/',
  polishCanonicalPath: '/pl/terms/',
});

export { default } from '@/app/pl/terms/page';
