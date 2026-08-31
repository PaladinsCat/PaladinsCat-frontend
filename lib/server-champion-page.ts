/**
 * Keeps server champion page server-side and aligned with its data source.
 * Preserve its server boundary and caller-facing data contracts.
 */
import "server-only";

import { unstable_cache } from "next/cache";
import type { ChampionPagePayload } from "@/lib/champion-page-data";
import { fetchServerJson } from "@/lib/server-api";
import { championSlug } from "@/lib/utils";

const getCachedChampionPageData = unstable_cache(
  async (slug: string) => fetchServerJson<ChampionPagePayload>(
    `/champions/${encodeURIComponent(slug)}/page-data`,
    { timeoutMs: 700 },
  ),
  ["champion-page-initial-v1"],
  { revalidate: 300 },
);

/**
 * Builds the initial champion page payload from server-side catalog data.
 */
export function getInitialChampionPageData(name: string): Promise<ChampionPagePayload> {
  return getCachedChampionPageData(championSlug(name));
}
