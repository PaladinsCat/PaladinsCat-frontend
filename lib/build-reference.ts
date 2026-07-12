import { fetchReferenceCards, fetchReferenceItems, fetchReferenceTalents } from "@/lib/api-client";
import { getChampionData, type ChampionData } from "@/lib/champion-data";

export type BuildItemCategory = "Offense" | "Defense" | "Healing" | "Utility";

export interface BuildItemReference {
  id: number;
  name: string;
  category: BuildItemCategory;
  description?: string | null;
  iconUrl?: string | null;
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

const CURRENT_ITEMS: Array<{ name: string; category: BuildItemCategory; fallbackId: number; fallbackDescription?: string }> = [
  { name: "Bulldozer", category: "Offense", fallbackId: 13079 },
  { name: "Deft Hands", category: "Offense", fallbackId: 13235 },
  { name: "Lethality", category: "Offense", fallbackId: 31100, fallbackDescription: "Increase your Movement Speed by {20|20}% and Jump Height by {60|60}% for 5s after getting an Elimination." },
  { name: "Trigger Scent", category: "Offense", fallbackId: 33071, fallbackDescription: "Increase your in-hand weapon damage dealt by {6|6}% for 5s after getting an Elimination." },
  { name: "Wrecker", category: "Offense", fallbackId: 13071 },
  { name: "Blast Shields", category: "Defense", fallbackId: 33618 },
  { name: "Guardian", category: "Defense", fallbackId: 13228, fallbackDescription: "Increase the effectiveness of Shields you create by {20|20}%." },
  { name: "Haven", category: "Defense", fallbackId: 13229 },
  { name: "Resilience", category: "Defense", fallbackId: 11683 },
  { name: "Sentinel", category: "Defense", fallbackId: 33075, fallbackDescription: "Gain a {200|200}-Health Shield for 5s after an Elimination. Stacks up to 3 times." },
  { name: "Bloodbath", category: "Healing", fallbackId: 33070, fallbackDescription: "Kills True Heal you, and Eliminations True Heal you and the ally who got the kill, for {360|360} Health over 4s. Stacks up to 2 times." },
  { name: "Life Rip", category: "Healing", fallbackId: 12010 },
  { name: "Meditation", category: "Healing", fallbackId: 33082, fallbackDescription: "Heal for an additional {2.5|2.5}% of your maximum Health every 0.25s while out of combat." },
  { name: "Rejuvenate", category: "Healing", fallbackId: 14633 },
  { name: "Veteran", category: "Healing", fallbackId: 13224 },
  { name: "Chronos", category: "Utility", fallbackId: 11723 },
  { name: "Hoard", category: "Utility", fallbackId: 33081, fallbackDescription: "Gain bonus Credits over time and on Eliminations. At level 3, gain 10% Movement, Mount, Cooldown, and Ultimate Charge speed instead." },
  { name: "Master Riding", category: "Utility", fallbackId: 11646 },
  { name: "Morale Boost", category: "Utility", fallbackId: 13165 },
  { name: "Nimble", category: "Utility", fallbackId: 11826 },
];

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

function usableDescription(value: string | null | undefined) {
  const description = String(value ?? "").trim();
  return description && !/^reference placeholder\b/i.test(description) ? description : null;
}

function withItemScaleFactors(value: string | null | undefined) {
  const description = usableDescription(value);
  if (!description) return null;
  // Older item references expose scalable values as {base}. Store the item
  // contract explicitly as {base|increase per level}; two-part tokens from
  // newer references are preserved as-is.
  return description.replace(/\{\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\}/g, (_match, base: string) => `{${base}|${base}}`);
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
  const byName = new Map<string, RawItem>();
  const localByName = new Map<string, RawItem>();
  for (const row of localItems) {
    localByName.set(normalizeName(nameOf(row, "item")), row);
  }
  for (const row of [...localItems, ...(dbItems as RawItem[])]) {
    byName.set(normalizeName(nameOf(row, "item")), row);
  }

  return CURRENT_ITEMS.map((item) => {
    const row = byName.get(normalizeName(item.name));
    const localRow = localByName.get(normalizeName(item.name));
    const id = row ? idOf(row, "item") : item.fallbackId;
    return {
      id: Number.isFinite(id) && id > 0 ? id : item.fallbackId,
      name: item.name,
      category: item.category,
      description: withItemScaleFactors(row?.description) ?? withItemScaleFactors(localRow?.description) ?? item.fallbackDescription ?? null,
      iconUrl: row?.icon_url ?? row?.iconUrl ?? itemIconPath(item.name),
    };
  });
}

async function buildCards(championId: number, champion?: ChampionData): Promise<BuildCardReference[]> {
  if (!champion?.loadouts?.length) return [];
  const [dbCards, localCards] = await Promise.all([
    fetchReferenceCards().catch(() => [] as RawCard[]),
    loadLocalCards(),
  ]);
  const byNameAndChampion = new Map<string, RawCard>();
  const byName = new Map<string, RawCard>();
  for (const row of [...localCards, ...(dbCards as RawCard[])]) {
    const key = normalizeName(nameOf(row, "card"));
    if (!key) continue;
    byName.set(key, row);
    const rowChampionId = championIdOf(row as RawCard);
    if (rowChampionId > 0) byNameAndChampion.set(`${rowChampionId}:${key}`, row as RawCard);
  }

  return champion.loadouts.map((card, index) => {
    const key = normalizeName(card.name);
    const row = byNameAndChampion.get(`${championId}:${key}`) ?? byName.get(key);
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
  const byNameAndChampion = new Map<string, RawTalent>();
  const byName = new Map<string, RawTalent>();
  for (const row of [...localTalents, ...(dbTalents as RawTalent[])]) {
    const key = normalizeName(nameOf(row, "talent"));
    if (!key) continue;
    byName.set(key, row);
    const rowChampionId = championIdOf(row as RawTalent);
    if (rowChampionId > 0) byNameAndChampion.set(`${rowChampionId}:${key}`, row as RawTalent);
  }

  return champion.talents.map((talent, index) => {
    const key = normalizeName(talent.name);
    const row = byNameAndChampion.get(`${championId}:${key}`) ?? byName.get(key);
    const id = row ? idOf(row, "talent") : 0;
    return {
      id: id > 0 ? id : -(index + 1),
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
  return { champion, items, cards, talents };
}

export function groupByCategory<T extends { category: string }>(rows: T[]): Array<[string, T[]]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const key = row.category || "General";
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  return Array.from(grouped.entries());
}
