/**
 * Keeps server champion data server-side and aligned with its data source.
 * Preserve its server boundary and caller-facing data contracts.
 * refs: none
 */
import "server-only";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ChampionData } from "@/lib/champion-data";
import { championSlug } from "@/lib/utils";

type ChampionDataMap = Record<string, ChampionData>;

let championDataPromise: Promise<ChampionDataMap> | null = null;

function loadChampionDataMap(): Promise<ChampionDataMap> {
  if (!championDataPromise) {
    const path = resolve(process.cwd(), "public", "data", "champion-data.json");
    championDataPromise = readFile(path, "utf8").then((content) => JSON.parse(content) as ChampionDataMap);
  }
  return championDataPromise;
}

/**
 * Loads one champion's catalog data for server-rendered champion pages.
 * Returns: `Promise<ChampionData | undefined>`
 * refs: none
 */
export async function getServerChampionData(slug: string): Promise<ChampionData | undefined> {
  const data = await loadChampionDataMap();
  return data[championSlug(slug)];
}
