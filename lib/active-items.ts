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

export const ACTIVE_ITEM_DATA_AUDITED_AT = auditedData.auditedAt;
export const ACTIVE_ITEM_DATA_SOURCE = auditedData.source;
export const ACTIVE_ITEMS = auditedData.items;

export function activeItemTierAtLevel(
  tiers: readonly ActiveItemTier[] | null | undefined,
  level: number,
): ActiveItemTier | null {
  if (!tiers?.length) return null;
  const normalizedLevel = Math.max(1, Math.min(3, Math.round(Number(level) || 1))) as ActiveItemLevel;
  return tiers.find((tier) => tier.level === normalizedLevel) ?? null;
}
