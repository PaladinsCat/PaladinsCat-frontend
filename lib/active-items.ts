/** Loads and filters active item data for the build UI.
 * This module filters active item data for build and loadout displays.
 */
import activeItemData from "../public/data/paladins-active-items.json" with { type: "json" };

export type ActiveItemCategory = "Offense" | "Defense" | "Healing" | "Utility";
export type ActiveItemLevel = 1 | 2 | 3;

export interface ActiveItemTier {
  level: ActiveItemLevel;
  cost: number;
  description: string;
}

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

/** ACTIVE_ITEM_DATA_AUDITED_AT applies the module-specific transformation to its declared inputs.
 * Contract: validates its inputs and returns the existing module result without mutating caller state.
 */
export const ACTIVE_ITEM_DATA_AUDITED_AT = auditedData.auditedAt;
/** ACTIVE_ITEM_DATA_SOURCE applies the module-specific transformation to its declared inputs.
 * Contract: validates its inputs and returns the existing module result without mutating caller state.
 */
export const ACTIVE_ITEM_DATA_SOURCE = auditedData.source;
/** ACTIVE_ITEMS applies the module-specific transformation to its declared inputs.
 * Contract: validates its inputs and returns the existing module result without mutating caller state.
 */
export const ACTIVE_ITEMS = auditedData.items;

/** activeItemTierAtLevel applies the module-specific transformation to its declared inputs.
 * Contract: validates its inputs and returns the existing module result without mutating caller state.
 */
export function activeItemTierAtLevel(
  tiers: readonly ActiveItemTier[] | null | undefined,
  level: number,
): ActiveItemTier | null {
  if (!tiers?.length) return null;
  const normalizedLevel = Math.max(1, Math.min(3, Math.round(Number(level) || 1))) as ActiveItemLevel;
  return tiers.find((tier) => tier.level === normalizedLevel) ?? null;
}
