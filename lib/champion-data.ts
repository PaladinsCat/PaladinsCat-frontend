/**
 * Load the cached champion data map and look up the normalized champion slug. Return undefined for an unknown champion; loading failures reject the promise.
 * Loads and normalizes champion data for pages.
 * refs: none
 */
import { championSlug } from "@/lib/utils";
import { getCanonicalTalentImageUrl } from "@/lib/image-assets";

/**
 * Describe champion skill with name, key, iconUrl (optional), iconUrl2 (optional), iconUrl3 (optional), damage (optional), healing (optional).
 * refs: none
 */
export interface ChampionSkill {
  name: string;
  key: string;
  iconUrl?: string | null;
  iconUrl2?: string | null;
  iconUrl3?: string | null;
  damage?: string | null;
  healing?: string | null;
  cooldown?: string | null;
  description?: string;
}

/**
 * Describe champion talent with id, name, description, category, iconUrl (optional).
 * refs: none
 */
export interface ChampionTalent {
  id: number;
  name: string;
  description: string;
  category: string;
  iconUrl?: string | null;
}

/**
 * Describe champion loadout with id, name, description, category, iconUrl (optional), cooldown (optional), values (optional).
 * refs: none
 */
export interface ChampionLoadout {
  id: number;
  name: string;
  description: string;
  category: string;
  iconUrl?: string | null;
  cooldown?: string | null;
  values?: string[] | null;
  pickRate?: number;
  winRate?: number;
}

/**
 * Describe champion stats with health, speed, speedUnits, range.
 * refs: none
 */
export interface ChampionStats {
  health: string;
  speed: string;
  speedUnits: string;
  range: string;
}

/**
 * Describe champion data with name, roles, stats, skills, talents, loadouts (optional), cards (optional).
 * refs: none
 */
export interface ChampionData {
  name: string;
  roles: string[];
  stats: ChampionStats;
  skills: ChampionSkill[];
  talents: ChampionTalent[];
  loadouts?: ChampionLoadout[];
  cards?: Array<{ name: string; values: string[]; category: string; iconUrl?: string | null }>;
}

type ChampionDataMap = Record<string, ChampionData>;

let championDataPromise: Promise<ChampionDataMap> | null = null;
let canonicalTalentImagesPromise: Promise<Map<number, string>> | null = null;

async function loadChampionDataMap(): Promise<ChampionDataMap> {
  if (!championDataPromise) {
    // Keep the 260KB wiki payload out of the TypeScript/Next module graph.
    // Importing it as a TS object literal made the dev/build process parse,
    // transform, type-check, and bundle every champion whenever one champion
    // page compiled. Fetching static JSON preserves the same local data while
    // keeping production memory bounded for the 2GB VPS Docker stack.
    // Version the static URL when its schema changes so CDN/browser caches do
    // not serve the pre-ID talent objects to the canonical image registry.
    championDataPromise = fetch("/data/champion-data.json?v=talent-ids-1")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load champion data: ${response.status}`);
        }
        return response.json() as Promise<ChampionDataMap>;
      });
  }
  return championDataPromise;
}

/**
 * Load the cached champion data map and look up the normalized champion slug. Return undefined for an unknown champion; loading failures reject the promise.
 * refs: none
 * I/O types: `slug: string -> Promise<ChampionData | undefined>`.
 */
export async function getChampionData(slug: string): Promise<ChampionData | undefined> {
  const data = await loadChampionDataMap();
  return data[championSlug(slug)];
}

async function loadCanonicalTalentImages(): Promise<Map<number, string>> {
  if (!canonicalTalentImagesPromise) {
    canonicalTalentImagesPromise = loadChampionDataMap().then((champions) => {
      const images = new Map<number, string>();
      for (const champion of Object.values(champions)) {
        for (const talent of champion.talents) {
          const imageUrl = getCanonicalTalentImageUrl(talent.iconUrl);
          if (imageUrl) images.set(talent.id, imageUrl);
        }
      }
      return images;
    });
  }
  return canonicalTalentImagesPromise;
}

/**
 * Resolve talent artwork only by the stable game ID. Display names are never
 * refs: none
 * used as asset keys, so API punctuation and localization cannot change URLs.
 * I/O types: `talentId: number -> Promise<string | null>`.
 */
export async function getCanonicalTalentIconPath(talentId: number): Promise<string | null> {
  if (!Number.isInteger(talentId) || talentId <= 0) return null;
  const images = await loadCanonicalTalentImages();
  return images.get(talentId) ?? null;
}
