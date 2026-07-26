// This is the public, selectable locale list. Do not advertise a translation
// until its locale files exist in the community locale repository.
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

export type Locale = (typeof SUPPORTED_LOCALES)[number]["code"];
export type ContributorLocale = (typeof CONTRIBUTOR_LOCALES)[number]["code"];
export const LOCALE_MODULES = localeModules;

export const COMMUNITY_LOCALE_BASE_URL = (
  process.env.NEXT_PUBLIC_LOCALE_BASE_URL
  ?? "/locales"
).replace(/\/+$/, "");

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return SUPPORTED_LOCALES.some(({ code }) => code === value);
}

export function communityLocaleUrl(locale: Locale, module: string) {
  return `${COMMUNITY_LOCALE_BASE_URL}/${encodeURIComponent(locale)}/${module}.json`;
}
import localeModules from "./modules.json";
