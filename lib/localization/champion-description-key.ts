import { EN_MESSAGES, type TranslationKey } from "@/lib/localization/messages";
import { championSlug } from "@/lib/utils";

/** Resolve the catalog key for a champion description, preserving source text when absent. */
export function championDescriptionKey(
  championName: string,
  section: "skills" | "talents" | "loadouts",
  entryName: string,
): TranslationKey | null {
  const candidate = `champions.${championSlug(championName)}.${section}.${championSlug(entryName)}.description`;
  return candidate in EN_MESSAGES ? candidate as TranslationKey : null;
}
