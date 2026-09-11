/**
 * Loads platform statistics for the initial server-rendered view.
 * Keeps server platforms server-side and aligned with its data source.
 * refs: none
 */
import "server-only";

import { cache } from "react";
import { fetchAccountServerJson } from "@/lib/server-api";
import type { PlatformStat } from "@/app/stats/platforms/platforms-client";

type PlatformStatRaw = {
  platform: string;
  champion_id: number | string;
  champion_name: string;
  total_matches: number | string;
  win_rate: number | string;
  avg_dpm: number | string;
  avg_hpm: number | string;
};

function numberOrZero(value: number | string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function displayPercent(value: number | string): number {
  const parsed = numberOrZero(value);
  return Math.abs(parsed) <= 1 ? parsed * 100 : parsed;
}

const getCachedPlatforms = cache(
  async (): Promise<PlatformStat[]> => {
    const rows = await fetchAccountServerJson<PlatformStatRaw[]>("/stats/platforms", {
      cache: "no-store",
      timeoutMs: 700,
    });
    return rows.map((row) => ({
      platform: row.platform,
      championId: numberOrZero(row.champion_id),
      championName: row.champion_name,
      totalMatches: numberOrZero(row.total_matches),
      winRate: displayPercent(row.win_rate),
      avgDpm: numberOrZero(row.avg_dpm),
      avgHpm: numberOrZero(row.avg_hpm),
    }));
  },
);

/**
 * Loads platform statistics for the initial server-rendered view.
 * refs: none
 * I/O types: `none -> Promise<PlatformStat[]>`.
 */
export function getInitialPlatforms(): Promise<PlatformStat[]> {
  return getCachedPlatforms();
}
