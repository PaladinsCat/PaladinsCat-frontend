/** Read bounded champion matchup aggregates using the shared API transport.
 * refs: endpoints: GET /stats/champions/{champion_id}/matchups · migrations: 171
 */
import { fetchJson } from "@/lib/api-client";

/**
 * Describe one opposing talent's aggregate; numeric JSON values may be strings.
 * I/O types: data contract `MatchupRow`; refs: migrations: 171
 */
export interface MatchupRow {
  opponent_champion_id: number; opponent_champion_name: string;
  opponent_talent_id: number; opponent_talent_name: string;
  wins: number | string; losses: number | string; samples: number | string;
  win_rate: number | string | null; coverage_from: string; coverage_to: string; updated_at: string;
}
/**
 * Describe a filtered matchup response with available champion talent selectors.
 * I/O types: data contract `ChampionMatchups`; refs: endpoints: GET /stats/champions/{champion_id}/matchups
 */
export interface ChampionMatchups {
  championId: number; talentId: number | null; queueId: number; days: number;
  talents: Array<{talent_id: number; talent_name: string}>; rows: MatchupRow[];
}
/**
 * Load one champion's opponent rows; abort supports rapid filter changes.
 * I/O types: `number`, `number`, `number`, `number`, `AbortSignal` -> `Promise<ChampionMatchups>`.
 * refs: endpoints: GET /stats/champions/{champion_id}/matchups
 */
export function fetchChampionMatchups(champion: number, talent: number, queue: number, days: number, signal: AbortSignal): Promise<ChampionMatchups> {
  const query = new URLSearchParams({queueId: String(queue), days: String(days)});
  if (talent) query.set("talentId", String(talent));
  return fetchJson<ChampionMatchups>(`/stats/champions/${champion}/matchups?${query}`, {signal, retries: 0});
}
