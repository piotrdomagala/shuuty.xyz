import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      'app/verify/page.tsx',
      'components/DocumentChrome.tsx',
      'components/HomePageClient.tsx',
    ],
    rules: {
      // These client-only theme and deep-link states intentionally synchronize after hydration.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['components/HomePageClient.tsx'],
    rules: {
      // React Compiler is not enabled; preserve the verified carousel callback as-is.
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  {
    files: ['components/useSiteLanguage.ts'],
    rules: {
      // Locale changes intentionally reload static PL/EN routes and restore the scroll anchor.
      '@next/next/no-location-assign-relative-destination': 'off',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
