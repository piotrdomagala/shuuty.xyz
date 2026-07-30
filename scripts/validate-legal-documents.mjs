import {readFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);

const files = {
  termsPl: 'public/documents/terms.md',
  termsEn: 'public/documents/terms_en.md',
  privacyPl: 'public/documents/privacy.md',
  privacyEn: 'public/documents/privacy_en.md',
};

const documents = Object.fromEntries(
  await Promise.all(
    Object.entries(files).map(async ([key, path]) => [
      key,
      await readFile(new URL(path, root), 'utf8'),
    ]),
  ),
);

const failures = [];

const requireText = (documentKey, values) => {
  const content = documents[documentKey];
  for (const value of values) {
    if (!content.includes(value)) {
      failures.push(`${files[documentKey]} is missing: ${value}`);
    }
  }
};

const requireSections = (documentKey, pattern, expected) => {
  const sections = [...documents[documentKey].matchAll(pattern)].map(
    match => Number(match[1]),
  );
  if (sections.join(',') !== expected.join(',')) {
    failures.push(
      `${files[documentKey]} has sections ${sections.join(',')}; expected ${expected.join(',')}`,
    );
  }
};

for (const [key, content] of Object.entries(documents)) {
  if (/\$?\s*1[.,]29\b|1[.,]29\s*USD/i.test(content)) {
    failures.push(`${files[key]} contains the retired fixed subscription price`);
  }
}

const companyIdentifiers = [
  'KRS 0000947279',
  '6372215912',
  '52098153800000',
  'support@shuuty.pl',
];

for (const key of Object.keys(documents)) {
  requireText(key, companyIdentifiers);
}

const sharedTerms = ['Free', 'Pro', 'Teams', 'App Store', 'Google Play'];
requireText('termsPl', [
  ...sharedTerms,
  'miesięcznych oraz rocznych',
  'odnawia się automatycznie',
  'Przywróć zakupy',
  'nie powoduje nowego obciążenia',
  'końca opłaconego okresu',
  'Uprawnienie do zwrotu',
]);
requireText('termsEn', [
  ...sharedTerms,
  'monthly and annual',
  'renews automatically',
  'Restore Purchases',
  'does not result in a new charge',
  'end of the paid period',
  'Refund eligibility',
]);

const providers = [
  'RevenueCat',
  'OpenAI',
  'Sentry',
  'Brevo',
  'Geoapify',
  'Google Maps',
  'Cloudflare R2',
  'Cloudinary',
  'Railway',
  'Neon',
  'Vercel',
];
requireText('privacyPl', [
  ...providers,
  'art. 6 ust. 1 lit. b RODO',
  'art. 6 ust. 1 lit. f RODO',
  'standardowe klauzule umowne',
  'wniesienia sprzeciwu',
  'Prezesa Urzędu Ochrony Danych Osobowych',
  'wycofania zgody',
  'Czy podanie danych jest obowiązkowe',
  'wyłącznie na zautomatyzowanym przetwarzaniu',
  'Sentry** w celu wykrywania i diagnozowania awarii oraz problemów z wydajnością, na podstawie prawnie uzasadnionego interesu',
  'wyłącza wysyłanie domyślnych danych identyfikujących, zrzutów ekranu i hierarchii widoku',
  'treści zadań, wiadomości, zdjęć i nagrań nie są celowo dołączane',
  'OpenAI, Expo, Sentry',
]);
requireText('privacyEn', [
  ...providers,
  'Article 6(1)(b) GDPR',
  'Article 6(1)(f) GDPR',
  'Standard Contractual Clauses',
  'object to processing',
  'President of the Personal Data Protection Office',
  'withdraw consent',
  'Whether providing data is mandatory',
  'based solely on automated processing',
  "Sentry** to detect and diagnose crashes and performance issues, based on Shuuty's legitimate interest",
  'disables default personally identifiable information, screenshots, and view hierarchy',
  'tasks, messages, photos, and recordings are not intentionally attached',
  'OpenAI, Expo, Sentry',
]);

const termsSections = Array.from({length: 14}, (_, index) => index + 1);
const privacySections = Array.from({length: 14}, (_, index) => index + 1);
requireSections('termsPl', /^## §(\d+)\./gm, termsSections);
requireSections('termsEn', /^## §(\d+)\./gm, termsSections);
requireSections('privacyPl', /^## (\d+)\./gm, privacySections);
requireSections('privacyEn', /^## (\d+)\./gm, privacySections);

if (failures.length > 0) {
  console.error(`Legal document validation failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Legal document validation passed.');
}
