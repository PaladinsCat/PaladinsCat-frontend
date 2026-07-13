"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  EN_MESSAGES,
  formatMessage,
  sanitizeLocaleMessages,
  type LocaleMessages,
  type TranslationKey,
  type TranslationValues,
} from "@/lib/localization/messages";
import {
  communityLocaleUrl,
  LOCALE_MODULES,
  type Locale,
} from "@/lib/localization/locales";

export { SUPPORTED_LOCALES, type Locale } from "@/lib/localization/locales";
export type { LocaleMessages, TranslationKey, TranslationValues } from "@/lib/localization/messages";

const STORAGE_KEY = "paladinscat:locale";
const LOCALE_COOKIE = "paladinscat_locale";
const TRANSLATION_CACHE_PREFIX = "paladinscat:translation:";
const MAX_TRANSLATION_BYTES = 250_000;
const EMPTY_MESSAGES: LocaleMessages = {};

const bundledTranslations: Partial<Record<Locale, LocaleMessages>> = {
  en: EN_MESSAGES,
};

interface LocalizationContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
}

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

function parseLocaleMessages(payload: string): LocaleMessages | null {
  if (payload.length > MAX_TRANSLATION_BYTES) return null;

  try {
    const parsed: unknown = JSON.parse(payload);
    return sanitizeLocaleMessages(parsed);
  } catch {
    return null;
  }
}

function getCachedLocaleMessages(locale: Locale): LocaleMessages {
  const cached = window.localStorage.getItem(`${TRANSLATION_CACHE_PREFIX}${locale}`);
  return cached ? parseLocaleMessages(cached) ?? {} : {};
}

export function LocalizationProvider({
  children,
  initialLocale = "en",
  initialMessages = EMPTY_MESSAGES,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialMessages?: LocaleMessages;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [communityMessages, setCommunityMessages] = useState<LocaleMessages>(initialMessages);

  useEffect(() => {
    setLocaleState(initialLocale);
    setCommunityMessages(initialMessages);
  }, [initialLocale, initialMessages]);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setCommunityMessages({});
    setLocaleState(nextLocale);
    document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (locale === "en") {
      setCommunityMessages({});
      return;
    }

    const cachedMessages = getCachedLocaleMessages(locale);
    setCommunityMessages(cachedMessages);

    const controller = new AbortController();
    async function loadCommunityLocale() {
      try {
        const moduleMessages = await Promise.all(LOCALE_MODULES.map(async (module) => {
          const response = await fetch(communityLocaleUrl(locale, module), {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!response.ok) return {};
          return parseLocaleMessages(await response.text()) ?? {};
        }));
        if (controller.signal.aborted) return;

        const messages = Object.assign({}, ...moduleMessages);

        window.localStorage.setItem(
          `${TRANSLATION_CACHE_PREFIX}${locale}`,
          JSON.stringify(messages),
        );
        setCommunityMessages(messages);
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          // Cached and bundled English strings provide a safe offline fallback.
          console.warn(`Unable to load the ${locale} community translation.`, error);
        }
      }
    }

    void loadCommunityLocale();
    return () => controller.abort();
  }, [locale]);

  const value = useMemo<LocalizationContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, values) => formatMessage(
        communityMessages[key] ?? bundledTranslations[locale]?.[key] ?? EN_MESSAGES[key],
        values,
      ),
    }),
    [communityMessages, locale, setLocale],
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) throw new Error("useLocalization must be used within a LocalizationProvider");
  return context;
}
