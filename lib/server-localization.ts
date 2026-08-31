/**
 * Keeps server localization server-side and aligned with its data source.
 * Preserve its server boundary and caller-facing data contracts.
 */
import "server-only";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { isSupportedLocale, LOCALE_MODULES, type Locale } from "@/lib/localization/locales";
import {
  sanitizeLocaleMessages,
  translate,
  type LocaleMessages,
  type TranslationKey,
  type TranslationValues,
} from "@/lib/localization/messages";

const LOCALE_COOKIE = "paladinscat_locale";
const localeMessageCache = new Map<Locale, Promise<LocaleMessages>>();

async function readLocaleMessages(locale: Locale): Promise<LocaleMessages> {
  if (locale === "en") return {};

  const modules = await Promise.all(LOCALE_MODULES.map(async (module) => {
    try {
      const path = resolve(process.cwd(), "public", "locales", locale, `${module}.json`);
      return sanitizeLocaleMessages(JSON.parse(await readFile(path, "utf8")));
    } catch {
      return {};
    }
  }));
  return Object.assign({}, ...modules);
}

/**
 * Loads locale messages and metadata for server-rendered localization.
 */
export async function getServerLocalization() {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isSupportedLocale(requestedLocale) ? requestedLocale : "en";

  let messagesPromise = localeMessageCache.get(locale);
  if (!messagesPromise) {
    messagesPromise = readLocaleMessages(locale);
    localeMessageCache.set(locale, messagesPromise);
  }
  const messages = await messagesPromise;

  return {
    locale,
    messages,
    t: (key: TranslationKey, values?: TranslationValues) => translate(messages, key, values),
  };
}

/**
 * Builds page metadata from localized messages and the requested locale.
 */
export async function createLocalizedMetadata(
  titleKey: TranslationKey,
  options: {
    descriptionKey?: TranslationKey;
    metadata?: Omit<Metadata, "title" | "description">;
  } = {},
): Promise<Metadata> {
  const { t } = await getServerLocalization();
  return {
    ...options.metadata,
    title: t(titleKey),
    ...(options.descriptionKey ? { description: t(options.descriptionKey) } : {}),
  };
}
