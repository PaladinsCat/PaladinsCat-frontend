/** Server-rendered seed data for the public ranked leaderboard.
 * refs: none
 */
import "server-only";

import { cache } from "react";
import type { RankedPlayer } from "@/lib/api-client";
import { fetchAccountServerJson } from "@/lib/server-api";

type RawRankedPlayer = {
  player_id: string;
  name: string;
  tier: number;
  points: number;
  rank: number;
  prev_rank?: number;
  trend?: number;
  wins?: number;
  losses?: number;
  leaves?: number;
  winrate?: number;
  leaverate?: number;
};

function rowsFrom(raw: unknown): RawRankedPlayer[] {
  if (Array.isArray(raw)) return raw as RawRankedPlayer[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: RawRankedPlayer[] }).data;
  }
  return [];
}

const getCachedGrandmasterLeaderboard = cache(
  async (): Promise<RankedPlayer[]> => {
    const raw = await fetchAccountServerJson<unknown>("/stats/ranked-leaderboard?tier=26&top=100", { timeoutMs: 2_000 });
    return rowsFrom(raw).map((row) => ({
      rank: row.rank,
      player_id: row.player_id,
      name: row.name,
      tier: row.tier,
      points: row.points,
      prev_rank: row.prev_rank,
      trend: row.trend,
      wins: row.wins,
      losses: row.losses,
      leaves: row.leaves,
      winRate: row.winrate,
      leaveRate: row.leaverate,
    }));
  },
);

/**
 * Loads the default public leaderboard rows for the initial HTML response.
 * I/O types: `none -> Promise<RankedPlayer[]>`.
 * refs: none
 */
export async function getInitialGrandmasterLeaderboard(): Promise<RankedPlayer[]> {
  return getCachedGrandmasterLeaderboard();
}
