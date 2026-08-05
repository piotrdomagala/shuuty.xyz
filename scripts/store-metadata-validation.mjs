export const STORE_METADATA_LOCALES = Object.freeze(["pl-PL", "en-US"]);

const TEXT_FIELDS = [
  ["appStore", "name", "App Store name", 30],
  ["appStore", "subtitle", "App Store subtitle", 30],
  ["appStore", "promotionalText", "App Store promotional text", 170],
  ["appStore", "description", "App Store description", 4_000],
  ["appStore", "whatsNew", "App Store What's New", 4_000],
  ["googlePlay", "appName", "Google Play app name", 30],
  ["googlePlay", "shortDescription", "Google Play short description", 80],
  ["googlePlay", "fullDescription", "Google Play full description", 4_000],
  ["googlePlay", "releaseNotes", "Google Play release notes", 500],
];

const APP_STORE_URLS = {
  marketingUrl: "https://shuuty.com/",
  supportUrl: "https://shuuty.com/support/",
  privacyPolicyUrl: "https://shuuty.com/privacy/",
  termsOfUseUrl: "https://shuuty.com/terms/",
};

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function countStoreCharacters(value) {
  return Array.from(value).length;
}

function requiredText(entry, section, field, label, locale, failures) {
  const value = isRecord(entry[section]) ? entry[section][field] : undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    failures.push(`${locale} ${label} is required`);
    return null;
  }
  return value;
}

function validateLocaleMetadata(entry, locale, failures) {
  for (const [section, field, label, maximum] of TEXT_FIELDS) {
    const value = requiredText(entry, section, field, label, locale, failures);
    if (value === null) continue;
    const length = countStoreCharacters(value);
    if (length > maximum) {
      failures.push(`${locale} ${label} is ${length}/${maximum} characters`);
    }
  }

  const keywords = requiredText(
    entry,
    "appStore",
    "keywords",
    "App Store keywords",
    locale,
    failures,
  );
  if (keywords !== null && Buffer.byteLength(keywords, "utf8") > 100) {
    failures.push(`${locale} App Store keywords exceed 100 UTF-8 bytes`);
  }

  for (const [field, expected] of Object.entries(APP_STORE_URLS)) {
    const value = requiredText(
      entry,
      "appStore",
      field,
      `App Store ${field}`,
      locale,
      failures,
    );
    if (value !== null && value !== expected) {
      failures.push(`${locale} App Store ${field} must be ${expected}`);
    }
  }
}

export function validateStoreMetadataSet(entries) {
  const failures = [];
  if (!Array.isArray(entries)) {
    return ["Store metadata must be an array"];
  }

  const byLocale = new Map();
  for (const entry of entries) {
    if (!isRecord(entry)) {
      failures.push("Store metadata entry must be an object");
      continue;
    }
    const { locale } = entry;
    if (typeof locale !== "string" || locale.length === 0) {
      failures.push("Store metadata entry locale is required");
      continue;
    }
    if (!STORE_METADATA_LOCALES.includes(locale)) {
      failures.push(`Unexpected locale ${locale}`);
      continue;
    }
    if (byLocale.has(locale)) {
      failures.push(`Duplicate metadata locale ${locale}`);
      continue;
    }
    byLocale.set(locale, entry);
  }

  for (const locale of STORE_METADATA_LOCALES) {
    const entry = byLocale.get(locale);
    if (!entry) {
      failures.push(`Missing ${locale} metadata`);
      continue;
    }
    validateLocaleMetadata(entry, locale, failures);
  }

  return failures;
}
