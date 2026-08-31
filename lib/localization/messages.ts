/** Defines localized message payloads and message lookup types.
 * The module owns the existing URL, context, or locale-message boundary.
 */
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
import diminishingReturnsMessages from "./catalog/pages/diminishing-returns.json";
import paladinsCatBotMessages from "./catalog/pages/paladinscat-bot.json";
import statusMessages from "./catalog/system/status.json";
import generatedUiMessages from "./catalog/generated/ui.json";
import seoMessages from "./catalog/seo/metadata.json";
import championMessages from "./catalog/game/champions.json";

/** Apply EN_MESSAGES to lobby-tier or localization inputs.
 * Contract: returns the normalized route, context state, or message value while preserving existing browser behavior.
 */
export const EN_MESSAGES = {
  // Generated strings are a fallback-only catalog. Keep them first so curated
  // modules remain authoritative when a key exists in both catalogs.
  ...generatedUiMessages,
  ...navigationMessages,
  ...commonMessages,
  ...moderationMessages,
  ...footerMessages,
  ...asyncMessages,
  ...homeMessages,
  ...localizationMessages,
  ...diminishingReturnsMessages,
  ...paladinsCatBotMessages,
  ...statusMessages,
  ...talentMessages,
  ...itemMessages,
  ...mapMessages,
  ...seoMessages,
  ...championMessages,
};
export type TranslationKey = keyof typeof EN_MESSAGES;
export type TranslationValues = Record<string, string | number>;
export type LocaleMessages = Partial<Record<TranslationKey, string>>;

/** Apply sanitizeLocaleMessages to lobby-tier or localization inputs.
 * Contract: returns the normalized route, context state, or message value while preserving existing browser behavior.
 */
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

/** Apply formatMessage to lobby-tier or localization inputs.
 * Contract: returns the normalized route, context state, or message value while preserving existing browser behavior.
 */
export function formatMessage(
  message: string,
  values?: TranslationValues,
) {
  if (!values) return message;
  return message.replace(/\{(\w+)\}/g, (placeholder, key: string) => (
    key in values ? String(values[key]) : placeholder
  ));
}

/** Apply translate to lobby-tier or localization inputs.
 * Contract: returns the normalized route, context state, or message value while preserving existing browser behavior.
 */
export function translate(
  messages: LocaleMessages,
  key: TranslationKey,
  values?: TranslationValues,
) {
  return formatMessage(messages[key] ?? EN_MESSAGES[key], values);
}
