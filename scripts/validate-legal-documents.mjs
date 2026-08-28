import {readFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);

const files = {
  termsPl: 'public/documents/terms.md',
  termsEn: 'public/documents/terms_en.md',
  privacyPl: 'public/documents/privacy.md',
  privacyEn: 'public/documents/privacy_en.md',
  accountDeletionPl: 'public/documents/account_deletion.md',
  accountDeletionEn: 'public/documents/account_deletion_en.md',
};

const documents = Object.fromEntries(
  await Promise.all(
    Object.entries(files).map(async ([key, path]) => [
      key,
      await readFile(new URL(path, root), 'utf8'),
    ]),
  ),
);

const supportPageSource = await readFile(
  new URL('components/SupportPageClient.tsx', root),
  'utf8',
);

const failures = [];
const supportEmail = 'shuuty.app@gmail.com';
const retiredSupportEmail = ['support', 'shuuty.pl'].join('@');
const retiredPricePattern =
  /(?<!\d)(?:\$\s*)?1[.,]29\b|(?<!\d)1[.,]29\s*USD\b/i;

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

const pricePatternCases = [
  { content: 'Retired price: $1.29', shouldMatch: true },
  { content: 'Retired price: 1,29 USD', shouldMatch: true },
  { content: 'Current example: $11.29', shouldMatch: false },
  { content: 'Current example: 21.29 USD', shouldMatch: false },
];

for (const { content, shouldMatch } of pricePatternCases) {
  if (retiredPricePattern.test(content) !== shouldMatch) {
    failures.push(`retired price guard produced an invalid result for: ${content}`);
  }
}

for (const [key, content] of Object.entries(documents)) {
  if (retiredPricePattern.test(content)) {
    failures.push(`${files[key]} contains the retired fixed subscription price`);
  }

  if (content.includes(retiredSupportEmail)) {
    failures.push(`${files[key]} contains the retired support address`);
  }
}

if (!supportPageSource.includes(`const SUPPORT_EMAIL = '${supportEmail}'`)) {
  failures.push('components/SupportPageClient.tsx does not use the confirmed support address');
}

if (supportPageSource.includes(retiredSupportEmail)) {
  failures.push('components/SupportPageClient.tsx contains the retired support address');
}

const companyIdentifiers = [
  'KRS 0000947279',
  '6372215912',
  '52098153800000',
  supportEmail,
];

for (const key of ['termsPl', 'termsEn', 'privacyPl', 'privacyEn']) {
  requireText(key, companyIdentifiers);
}

requireText('accountDeletionPl', [
  supportEmail,
  'Profil',
  'Usuń konto',
  'Nigdy nie przesyłaj nam hasła',
  'Polityka prywatności',
  'https://shuuty.com/pl/privacy/',
  'App Store',
  'Google Play',
  'nie anuluje automatycznie subskrypcji',
]);
requireText('accountDeletionEn', [
  supportEmail,
  'Profile',
  'Delete account',
  'Never send us your password',
  'Privacy Policy',
  'https://shuuty.com/privacy/',
  'App Store',
  'Google Play',
  'does not automatically cancel a subscription',
]);

const sharedTerms = ['Free', 'Pro', 'Teams', 'App Store', 'Google Play'];
requireText('termsPl', [
  ...sharedTerms,
  'miesięcznych oraz rocznych',
  'odnawia się automatycznie',
  'Przywróć zakupy',
  'nie powoduje nowego obciążenia',
  'końca opłaconego okresu',
  'Uprawnienie do zwrotu',
  'kalendarza urządzenia',
  'na żądanie użytkownika',
]);
requireText('termsEn', [
  ...sharedTerms,
  'monthly and annual',
  'renews automatically',
  'Restore Purchases',
  'does not result in a new charge',
  'end of the paid period',
  'Refund eligibility',
  'device calendar',
  "at the user's request",
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
  'Dostęp do kalendarza urządzenia',
  'systemowy dialog utworzenia wydarzenia',
  'uprawnienie do odczytu i zapisu kalendarza',
  'Udzielenie tego uprawnienia jest dobrowolne',
  'wyłącznie na wyraźne żądanie użytkownika',
  'Treść kalendarza urządzenia nie jest wysyłana na serwery Shuuty',
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
  'Access to the device calendar',
  'system event-creation dialog',
  'permission to read and write the calendar',
  'Granting this permission is voluntary',
  "only at the user's express request",
  "contents of the device calendar are not sent to Shuuty's servers",
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
