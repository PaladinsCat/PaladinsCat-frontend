import asyncMessages from "./catalog/ui/async.json";
import footerMessages from "./catalog/ui/footer.json";
import navigationMessages from "./catalog/ui/navigation.json";
import commonMessages from "./catalog/ui/common.json";
import moderationMessages from "./catalog/ui/moderation.json";
import itemMessages from "./catalog/game/items.json";
import mapMessages from "./catalog/game/maps.json";
import talentMessages from "./catalog/game/talents.json";
import homeMessages from "./catalog/pages/home.json";
import localizationMessages from "./catalog/pages/localization.json";
import statusMessages from "./catalog/system/status.json";
import generatedUiMessages from "./catalog/generated/ui.json";
import seoMessages from "./catalog/seo/metadata.json";

export const EN_MESSAGES = {
  ...navigationMessages,
  ...commonMessages,
  ...moderationMessages,
  ...footerMessages,
  ...asyncMessages,
  ...homeMessages,
  ...localizationMessages,
  ...statusMessages,
  ...talentMessages,
  ...itemMessages,
  ...mapMessages,
  ...generatedUiMessages,
  ...seoMessages,
};
export type TranslationKey = keyof typeof EN_MESSAGES;
export type TranslationValues = Record<string, string | number>;
export type LocaleMessages = Partial<Record<TranslationKey, string>>;

export function sanitizeLocaleMessages(payload: unknown): LocaleMessages {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};

  const messages: LocaleMessages = {};
  for (const [key, value] of Object.entries(payload)) {
    if (key in EN_MESSAGES && typeof value === "string" && value.length <= 1_000) {
      messages[key as TranslationKey] = value;
    }
  }
  return messages;
}

export function formatMessage(
  message: string,
  values?: TranslationValues,
) {
  if (!values) return message;
  return message.replace(/\{(\w+)\}/g, (placeholder, key: string) => (
    key in values ? String(values[key]) : placeholder
  ));
}

export function translate(
  messages: LocaleMessages,
  key: TranslationKey,
  values?: TranslationValues,
) {
  return formatMessage(messages[key] ?? EN_MESSAGES[key], values);
}
