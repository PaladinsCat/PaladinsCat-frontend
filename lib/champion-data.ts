import { championSlug } from "@/lib/utils";
import { getTalentImageUrl } from "@/lib/image-assets";

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

export interface ChampionTalent {
  name: string;
  description: string;
  category: string;
  iconUrl?: string | null;
}

export interface ChampionLoadout {
  name: string;
  description: string;
  category: string;
  iconUrl?: string | null;
  cooldown?: string | null;
  values?: string[] | null;
  pickRate?: number;
  winRate?: number;
}

export interface ChampionStats {
  health: string;
  speed: string;
  speedUnits: string;
  range: string;
}

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

async function loadChampionDataMap(): Promise<ChampionDataMap> {
  if (!championDataPromise) {
    // Keep the 260KB wiki payload out of the TypeScript/Next module graph.
    // Importing it as a TS object literal made the dev/build process parse,
    // transform, type-check, and bundle every champion whenever one champion
    // page compiled. Fetching static JSON preserves the same local data while
    // keeping production memory bounded for the 2GB VPS Docker stack.
    championDataPromise = fetch("/data/champion-data.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load champion data: ${response.status}`);
        }
        return response.json() as Promise<ChampionDataMap>;
      });
  }
  return championDataPromise;
}

export async function getChampionData(slug: string): Promise<ChampionData | undefined> {
  const data = await loadChampionDataMap();
  return data[championSlug(slug)];
}

// Talent image paths.
export function getTalentIconPath(championName: string, talentName: string): string {
  return getTalentImageUrl(championName, talentName);
}
