/** Fetch and combine observed player trend sufficient statistics.
 * Missing samples remain null; cumulative baselines subtract the displayed window.
 * refs: endpoints: GET /players/{id}/trends · migrations: 169
 */
import { fetchJson } from "@/lib/api-client";

/**
 * Name the shared per-match rate contracts. I/O: type only; refs: migrations: 169
 */
export type PlayerTrendMetric = "dpm" | "wpm" | "apm" | "hpm" | "shpm" | "spm" | "gpm" | "egpm" | "kda" | "kpm" | "deaths_per_minute";
/**
 * Hold additive samples for one account/champion scope. I/O: JSON -> typed values; refs: migrations: 169
 */
export interface PlayerTrendTotals {
  championId: number; matches: number; wins: number;
  openingElo?: number | null;
  sums: Partial<Record<PlayerTrendMetric, number>>;
  samples: Partial<Record<PlayerTrendMetric, number>>;
}
/**
 * Hold a UTC daily bucket and last observed rating. I/O: JSON -> typed values; refs: endpoints: GET /players/{id}/trends
 */
export interface PlayerTrendBucket extends PlayerTrendTotals { date: string; elo: number | null }
/**
 * Describe the bounded chart response and indexed coverage. I/O: JSON -> typed values; refs: endpoints: GET /players/{id}/trends
 */
export interface PlayerTrends {
  queueId: number; days: number; from: string; to: string; timezone: "UTC";
  scope: "indexed"; truncated: boolean; buckets: PlayerTrendBucket[];
  totals: PlayerTrendTotals[]; globalTotals: PlayerTrendTotals[]; queueIds: number[];
  coverage: { availableFrom: string | null; availableTo: string | null; compactArchiveMatches: number };
}

/**
 * Fetch all observations within the requested window, with no latest-N cap.
 * I/O: string, 7|30, number, number[], AbortSignal? -> Promise<PlayerTrends>;
 * performs one authenticated HTTP read; failures propagate to the visible UI.
 * refs: endpoints: GET /players/{id}/trends
 * I/O types: `playerId: string; days: 7 | 30; queueId: number; championIds: number[]; signal?: AbortSignal -> Promise<PlayerTrends>`.
 */
export function fetchPlayerTrends(playerId: string, days: 7 | 30, queueId: number, championIds: number[], signal?: AbortSignal): Promise<PlayerTrends> {
  const query = new URLSearchParams({ days: String(days), queueId: String(queueId), championIds: [...championIds].sort((a,b)=>a-b).join(",") });
  return fetchJson<PlayerTrends>(`/players/${encodeURIComponent(playerId)}/trends?${query}`, { signal });
}
