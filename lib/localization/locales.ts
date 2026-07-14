// This is the public, selectable locale list. Do not advertise a translation
// until its locale files exist in the community locale repository.
export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
] as const;

// Contributor targets are intentionally separate from public locales: they let
// an approved translator start a locale without making an incomplete language
// visible in the site header.
export const CONTRIBUTOR_LOCALES = [
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "ko", label: "한국어" },
  { code: "pl", label: "Polski" },
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
  { code: "zh-CN", label: "简体中文" },
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
