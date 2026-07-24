import { fetchReferenceCards, fetchReferenceItems, fetchReferenceTalents } from "@/lib/api-client";
import { getChampionData, type ChampionData } from "@/lib/champion-data";
import { canonicalCardNameKey } from "@/lib/card-name";
import type { TranslationKey } from "@/lib/localization/messages";
import {
  ACTIVE_ITEMS,
  activeItemTierAtLevel,
  type ActiveItemCategory,
  type ActiveItemTier,
} from "@/lib/active-items";

export type BuildItemCategory = ActiveItemCategory;

export interface BuildItemReference {
  id: number;
  name: string;
  category: BuildItemCategory;
  description?: string | null;
  descriptionKey?: TranslationKey | null;
  iconUrl?: string | null;
  tiers: readonly ActiveItemTier[];
  sourceUrl: string;
}

export interface BuildCardReference {
  id: number;
  name: string;
  category: string;
  description?: string | null;
  iconUrl?: string | null;
}

export interface BuildTalentReference {
  id: number;
  name: string;
  category: string;
  description?: string | null;
  iconUrl?: string | null;
}

export interface BuildReferenceData {
  championId: number;
  champion?: ChampionData;
  items: BuildItemReference[];
  cards: BuildCardReference[];
  talents: BuildTalentReference[];
}

type RawItem = {
  id?: number;
  item_id?: number;
  name?: string;
  item_name?: string;
  description?: string | null;
  itemType?: string | null;
  item_type?: string | null;
  iconUrl?: string | null;
  icon_url?: string | null;
};

type RawCard = {
  id?: number;
  card_id?: number;
  name?: string;
  card_name?: string;
  championId?: number;
  champion_id?: number;
  description?: string | null;
  iconUrl?: string | null;
  icon_url?: string | null;
  category?: string | null;
};

type RawTalent = {
  id?: number;
  talent_id?: number;
  name?: string;
  talent_name?: string;
  championId?: number;
  champion_id?: number;
  description?: string | null;
  iconUrl?: string | null;
  icon_url?: string | null;
  category?: string | null;
};

let localItemPromise: Promise<RawItem[]> | null = null;
let localCardPromise: Promise<RawCard[]> | null = null;
let localTalentPromise: Promise<RawTalent[]> | null = null;

function normalizeName(value: string | null | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function itemIconPath(name: string) {
  return `/images/items/${name.replace(/\s+/g, "_")}_Icon.avif`;
}

async function loadLocalItems() {
  if (!localItemPromise) {
    localItemPromise = fetch("/data/paladins-items-reference.json")
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => []);
  }
  return localItemPromise;
}

async function loadLocalCards() {
  if (!localCardPromise) {
    localCardPromise = fetch("/data/paladins-card-reference.json")
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => []);
  }
  return localCardPromise;
}

async function loadLocalTalents() {
  if (!localTalentPromise) {
    localTalentPromise = fetch("/data/paladins-talent-reference.json")
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => []);
  }
  return localTalentPromise;
}

function idOf(row: RawItem | RawCard | RawTalent, key: "item" | "card" | "talent") {
  if (key === "item") return Number((row as RawItem).item_id ?? row.id ?? 0);
  if (key === "card") return Number((row as RawCard).card_id ?? row.id ?? 0);
  return Number((row as RawTalent).talent_id ?? row.id ?? 0);
}

function nameOf(row: RawItem | RawCard | RawTalent, key: "item" | "card" | "talent") {
  if (key === "item") return String((row as RawItem).item_name ?? row.name ?? "");
  if (key === "card") return String((row as RawCard).card_name ?? row.name ?? "");
  return String((row as RawTalent).talent_name ?? row.name ?? "");
}

function championIdOf(row: RawCard | RawTalent) {
  return Number(row.champion_id ?? row.championId ?? 0);
}

async function buildItems(): Promise<BuildItemReference[]> {
  const [dbItems, localItems] = await Promise.all([
    fetchReferenceItems().catch(() => [] as RawItem[]),
    loadLocalItems(),
  ]);
  const dbByName = new Map<string, RawItem>();
  const localByName = new Map<string, RawItem>();
  for (const row of localItems) {
    localByName.set(normalizeName(nameOf(row, "item")), row);
  }
  for (const row of dbItems as RawItem[]) {
    dbByName.set(normalizeName(nameOf(row, "item")), row);
  }

  return ACTIVE_ITEMS.map((item) => {
    const key = normalizeName(item.name);
    const dbRow = dbByName.get(key);
    const localRow = localByName.get(key);
    const row = dbRow ?? localRow;
    // The bundled file contains historical item IDs. Use it for descriptions
    // and images only; current IDs come from the database or the maintained
    // fallback roster so removed/reused store entries cannot collide.
    const id = dbRow ? idOf(dbRow, "item") : item.fallbackId;
    return {
      id: Number.isFinite(id) && id > 0 ? id : item.fallbackId,
      name: item.name,
      category: item.category,
      description: item.tiers[0].description,
      descriptionKey: null,
      iconUrl: row?.icon_url ?? row?.iconUrl ?? itemIconPath(item.name),
      tiers: item.tiers.map((tier) => ({ ...tier })),
      sourceUrl: `https://paladins.fandom.com/wiki/${item.wikiSlug}`,
    };
  });
}

export function itemDescriptionAtLevel(
  item: Pick<BuildItemReference, "description" | "tiers"> | null | undefined,
  level: number,
): string | null {
  return activeItemTierAtLevel(item?.tiers, level)?.description ?? item?.description ?? null;
}

async function buildCards(championId: number, champion?: ChampionData): Promise<BuildCardReference[]> {
  if (!champion?.loadouts?.length) return [];
  const [dbCards, localCards] = await Promise.all([
    fetchReferenceCards().catch(() => [] as RawCard[]),
    loadLocalCards(),
  ]);
  const byNameAndChampion = new Map<string, RawCard>();
  const byName = new Map<string, RawCard>();
  const byCanonicalNameAndChampion = new Map<string, RawCard>();
  const byCanonicalName = new Map<string, RawCard>();
  for (const row of [...localCards, ...(dbCards as RawCard[])]) {
    const key = normalizeName(nameOf(row, "card"));
    if (!key) continue;
    byName.set(key, row);
    const rowChampionId = championIdOf(row as RawCard);
    if (rowChampionId > 0) byNameAndChampion.set(`${rowChampionId}:${key}`, row as RawCard);
    const canonicalKey = canonicalCardNameKey(nameOf(row, "card"));
    if (canonicalKey) {
      byCanonicalName.set(canonicalKey, row);
      if (rowChampionId > 0) byCanonicalNameAndChampion.set(`${rowChampionId}:${canonicalKey}`, row as RawCard);
    }
  }

  return champion.loadouts.map((card, index) => {
    const key = normalizeName(card.name);
    const canonicalKey = canonicalCardNameKey(card.name);
    const row = byNameAndChampion.get(`${championId}:${key}`)
      ?? byCanonicalNameAndChampion.get(`${championId}:${canonicalKey}`)
      ?? byName.get(key)
      ?? byCanonicalName.get(canonicalKey);
    const id = row ? idOf(row, "card") : 0;
    return {
      id: id > 0 ? id : -(index + 1),
      name: card.name,
      category: card.category || "General",
      description: row?.description ?? card.description ?? null,
      iconUrl: card.iconUrl ?? row?.icon_url ?? row?.iconUrl ?? null,
    };
  });
}

async function buildTalents(championId: number, champion?: ChampionData): Promise<BuildTalentReference[]> {
  if (!champion?.talents?.length) return [];
  const [dbTalents, localTalents] = await Promise.all([
    fetchReferenceTalents().catch(() => [] as RawTalent[]),
    loadLocalTalents(),
  ]);
  const byId = new Map<number, RawTalent>();
  for (const row of [...localTalents, ...(dbTalents as RawTalent[])]) {
    const id = idOf(row, "talent");
    if (id > 0) byId.set(id, row);
  }

  return champion.talents.map((talent) => {
    const row = byId.get(talent.id);
    return {
      id: talent.id,
      name: talent.name,
      category: talent.category || "Talent",
      description: row?.description ?? talent.description ?? null,
      iconUrl: talent.iconUrl ?? row?.icon_url ?? row?.iconUrl ?? null,
    };
  });
}

export async function loadBuildReferenceData(championId: number, championSlug: string): Promise<BuildReferenceData> {
  const champion = championSlug ? await getChampionData(championSlug).catch(() => undefined) : undefined;
  const [items, cards, talents] = await Promise.all([
    buildItems(),
    buildCards(championId, champion),
    buildTalents(championId, champion),
  ]);
  return { championId, champion, items, cards, talents };
}

/** Load only the card data needed by saved-deck views. This avoids fetching
 * item and talent references on a route that never renders either dataset. */
export async function loadBuildCardReferences(championId: number, championSlug: string): Promise<BuildCardReference[]> {
  const champion = championSlug ? await getChampionData(championSlug).catch(() => undefined) : undefined;
  return buildCards(championId, champion);
}

export function groupByCategory<T extends { category: string }>(rows: T[]): Array<[string, T[]]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const key = row.category || "General";
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  return Array.from(grouped.entries());
}
