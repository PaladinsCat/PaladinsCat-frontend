/** Loads and filters active item data for the build UI.
 * This module filters active item data for build and loadout displays.
 * refs: none
 */
import activeItemData from "../public/data/paladins-active-items.json" with { type: "json" };

/**
 * Define active item category as `"Offense" | "Defense" | "Healing" | "Utility"`.
 * refs: none
 */
export type ActiveItemCategory = "Offense" | "Defense" | "Healing" | "Utility";
/**
 * Define active item level as `1 | 2 | 3`.
 * refs: none
 */
export type ActiveItemLevel = 1 | 2 | 3;

/**
 * Describe active item tier with level, cost, description.
 * refs: none
 */
export interface ActiveItemTier {
  level: ActiveItemLevel;
  cost: number;
  description: string;
}

/**
 * Describe active item definition with name, category, fallbackId, wikiSlug, tiers.
 * refs: none
 */
export interface ActiveItemDefinition {
  name: string;
  category: ActiveItemCategory;
  fallbackId: number;
  wikiSlug: string;
  tiers: readonly [ActiveItemTier, ActiveItemTier, ActiveItemTier];
}

interface ActiveItemDataFile {
  auditedAt: string;
  source: string;
  items: readonly ActiveItemDefinition[];
}

const auditedData = activeItemData as unknown as ActiveItemDataFile;

/**
 * Expose the audit timestamp stored in the checked-in active-item data.
 * refs: none
 */
export const ACTIVE_ITEM_DATA_AUDITED_AT = auditedData.auditedAt;
/**
 * Expose the provenance source stored in the checked-in active-item data.
 * refs: none
 */
export const ACTIVE_ITEM_DATA_SOURCE = auditedData.source;
/**
 * Expose the checked-in active-item definitions and their three purchase tiers.
 * refs: none
 */
export const ACTIVE_ITEMS = auditedData.items;

/**
 * Round the requested item level and clamp it to 1-3, using one for a falsy numeric conversion. Return the matching tier or null when tiers are absent or do not contain that level.
 * refs: none
 * I/O types: `tiers: readonly ActiveItemTier[] | null | undefined; level: number -> ActiveItemTier | null`.
 */
export function activeItemTierAtLevel(
  tiers: readonly ActiveItemTier[] | null | undefined,
  level: number,
): ActiveItemTier | null {
  if (!tiers?.length) return null;
  const normalizedLevel = Math.max(1, Math.min(3, Math.round(Number(level) || 1))) as ActiveItemLevel;
  return tiers.find((tier) => tier.level === normalizedLevel) ?? null;
}
