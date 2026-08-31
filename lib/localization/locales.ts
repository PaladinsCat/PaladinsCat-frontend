/**
 * Defines locales's shared contracts and runtime helpers.
 * Keep behavior aligned with its callers and browser/server boundary.
 */
// This is the public, selectable locale list. Do not advertise a translation
// until its locale files exist in the community locale repository.
/**
 * Defines the  s u p p o r t e d_ l o c a l e s contract used by this module.
 */
export const SUPPORTED_LOCALES = [
  { code: "en", nativeName: "English" },
  { code: "de", nativeName: "Deutsch" },
  { code: "es-419", nativeName: "Español (Latinoamérica)" },
  { code: "fr", nativeName: "Français" },
  { code: "ja", nativeName: "日本語" },
  { code: "ko", nativeName: "한국어" },
  { code: "pl", nativeName: "Polski" },
  { code: "pt-BR", nativeName: "Português (Brasil)" },
  { code: "ru", nativeName: "Русский" },
  { code: "tr", nativeName: "Türkçe" },
  { code: "zh-CN", nativeName: "简体中文" },
  { code: "zh-TW", nativeName: "繁體中文" },
] as const;

// Contributor targets are intentionally separate from public locales: they let
// an approved translator start a locale without making an incomplete language
// visible in the site header.
/**
 * Defines the  c o n t r i b u t o r_ l o c a l e s contract used by this module.
 */
export const CONTRIBUTOR_LOCALES = [
  { code: "de", nativeName: "Deutsch" },
  { code: "es-419", nativeName: "Español (Latinoamérica)" },
  { code: "fr", nativeName: "Français" },
  { code: "ja", nativeName: "日本語" },
  { code: "ko", nativeName: "한국어" },
  { code: "pl", nativeName: "Polski" },
  { code: "pt-BR", nativeName: "Português (Brasil)" },
  { code: "ru", nativeName: "Русский" },
  { code: "tr", nativeName: "Türkçe" },
  { code: "zh-CN", nativeName: "简体中文" },
  { code: "zh-TW", nativeName: "繁體中文" },
] as const;

/**
 * Defines the  locale contract used by this module.
 */
export type Locale = (typeof SUPPORTED_LOCALES)[number]["code"];
/**
 * Defines the  contributor locale contract used by this module.
 */
export type ContributorLocale = (typeof CONTRIBUTOR_LOCALES)[number]["code"];
/**
 * Defines the  l o c a l e_ m o d u l e s contract used by this module.
 */
export const LOCALE_MODULES = localeModules;

/**
 * Defines the  c o m m u n i t y_ l o c a l e_ b a s e_ u r l contract used by this module.
 */
export const COMMUNITY_LOCALE_BASE_URL = (
  process.env.NEXT_PUBLIC_LOCALE_BASE_URL
  ?? "/locales"
).replace(/\/+$/, "");

/**
 * Transforms or validates is supported locale according to this module's data contract.
 */
export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return SUPPORTED_LOCALES.some(({ code }) => code === value);
}

/**
 * Defines the community locale url contract used by this module.
 */
export function communityLocaleUrl(locale: Locale, module: string) {
  return `${COMMUNITY_LOCALE_BASE_URL}/${encodeURIComponent(locale)}/${module}.json`;
}
import localeModules from "./modules.json";
