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
import {
  formatLocalDate,
  formatLocalDateTime,
  formatLocalHourFromUtcBucket,
  formatLocalMonthDay,
  formatLocalTime,
  formatRelativeTime,
} from "@/lib/time-format";

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
  formatNumber: (value: number | null | undefined, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (value: number | null | undefined, options?: Intl.NumberFormatOptions) => string;
  formatSignedPercent: (value: number | null | undefined, options?: Intl.NumberFormatOptions) => string;
  formatRecord: (wins: number, losses: number) => string;
  formatDuration: (seconds: number) => string;
  formatDate: (value: string | null | undefined) => string;
  formatDateTime: (value: string | null | undefined) => string;
  formatHourFromUtcBucket: (date: string | null | undefined, hour: number | null | undefined) => string;
  formatMonthDay: (value: string | null | undefined) => string;
  formatRelative: (value: string | null | undefined) => string;
  formatTime: (value: string | null | undefined) => string;
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

  const value = useMemo<LocalizationContextValue>(() => {
    const t = (key: TranslationKey, values?: TranslationValues) => formatMessage(
      communityMessages[key] ?? bundledTranslations[locale]?.[key] ?? EN_MESSAGES[key],
      values,
    );
    const integerFormatter = new Intl.NumberFormat(locale);
    const percentFormatter = new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const signedPercentFormatter = new Intl.NumberFormat(locale, {
      style: "percent",
      signDisplay: "always",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const formatNumber = (number: number | null | undefined, options?: Intl.NumberFormatOptions) => {
      if (number == null || !Number.isFinite(number)) return "—";
      return options ? new Intl.NumberFormat(locale, options).format(number) : integerFormatter.format(number);
    };

    return {
      locale,
      setLocale,
      t,
      formatNumber,
      formatPercent: (number, options) => (
        number == null || !Number.isFinite(number)
          ? "—"
          : options
          ? new Intl.NumberFormat(locale, { style: "percent", ...options }).format(number / 100)
          : percentFormatter.format(number / 100)
      ),
      formatSignedPercent: (number, options) => (
        number == null || !Number.isFinite(number)
          ? "—"
          : options
          ? new Intl.NumberFormat(locale, { style: "percent", signDisplay: "always", ...options }).format(number / 100)
          : signedPercentFormatter.format(number / 100)
      ),
      formatRecord: (wins, losses) => t("common.format.winLossCompact", {
        wins: formatNumber(wins),
        losses: formatNumber(losses),
      }),
      formatDuration: (seconds) => {
        const total = Math.max(0, Math.round(seconds || 0));
        return t("common.format.durationShort", {
          minutes: formatNumber(Math.floor(total / 60)),
          seconds: formatNumber(total % 60),
        });
      },
      formatDate: (input) => formatLocalDate(input, locale),
      formatDateTime: (input) => formatLocalDateTime(input, locale),
      formatHourFromUtcBucket: (date, hour) => formatLocalHourFromUtcBucket(date, hour, locale),
      formatMonthDay: (input) => formatLocalMonthDay(input, locale),
      formatRelative: (input) => formatRelativeTime(input, locale),
      formatTime: (input) => formatLocalTime(input, locale),
    };
  }, [communityMessages, locale, setLocale]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) throw new Error("useLocalization must be used within a LocalizationProvider");
  return context;
}

export function LocalizedText({
  id,
  values,
}: {
  id: TranslationKey;
  values?: TranslationValues;
}) {
  const { t } = useLocalization();
  return <>{t(id, values)}</>;
}
