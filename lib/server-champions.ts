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

export async function getInitialRankedChampions(): Promise<Champion[]> {
  return getCachedRankedChampions();
}
