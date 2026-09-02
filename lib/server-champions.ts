/**
 * Keeps server champions server-side and aligned with its data source.
 * Preserve its server boundary and caller-facing data contracts.
 * refs: none
 */
import "server-only";

import { unstable_cache } from "next/cache";
import {
  mapChampionsOverview,
  type Champion,
  type ChampionOverviewRaw,
} from "@/lib/api-client";
import { fetchServerJson } from "@/lib/server-api";

const getCachedRankedChampions = unstable_cache(
  async (): Promise<Champion[]> => {
    const raw = await fetchServerJson<ChampionOverviewRaw>("/champions/overview?scope=ranked", { timeoutMs: 700 });
    return mapChampionsOverview(raw);
  },
  ["ranked-champions-initial-v1"],
  { revalidate: 300, tags: ["ranked-champions"] },
);

/**
 * Loads the ranked champion catalog used to seed server-rendered views.
 * Returns: `Promise<Champion[]>`
 * refs: none
 */
export async function getInitialRankedChampions(): Promise<Champion[]> {
  return getCachedRankedChampions();
}
