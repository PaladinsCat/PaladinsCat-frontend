/**
 * Shared types for the match-result component tree.
 * All calculation/formatting logic lives in format.ts — these are pure shapes.
 * refs: none
 */

import type {
  MatchPlayerDetail,
  MatchFactPlayer,
  MatchBan,
  RatingSnapshot,
} from "@/lib/api-client";

/** Match player enriched from the canonical stored profile or an ingest snapshot fallback. · refs: none */
export interface MatchResultPlayer {
  matchData: MatchPlayerDetail;
  factData?: MatchFactPlayer;
  profileData?: PlayerProfileData | null;
}

/** Slim historical profile shape embedded in GET /api/matches/:id. · refs: none */
export interface PlayerProfileData {
  id: string;
  name: string;
  level: number | null;
  platform: string;
  region: string;
  kbmTier: string | number | null;
  kbmPoints: number | null;
  kbmRank?: number | null;
  queueElo?: number | null;
  championElo?: number | null;
  globalWins?: number | null;
  globalLosses?: number | null;
  globalWinRate?: number | null;
  rankedWins?: number | null;
  rankedLosses?: number | null;
  capturedAt?: string | null;
  snapshotSource?: string | null;
  cheater?: boolean;
  exploiter?: boolean;
  susCount?: number;
  verified?: boolean;
  totalMatches: number;
  totalWins: number;
  winRate: number | null;
  totalPlays: number;
  topChampions: TopChampion[];
}

export interface TopChampion {
  championName: string;
  championId: number;
  wins: number;
  totalPlays: number;
  winRate: number;
}

/** Map from player_id → profile, keyed by string (API returns string IDs at runtime). · refs: none */
export type ProfileByPlayerId = Map<string, PlayerProfileData>;

/** Map from player_id → fact data, keyed by string (API returns string IDs at runtime). · refs: none */
export type FactByPlayerId = Map<string, MatchFactPlayer>;

/** Team grouping with identity. · refs: none */
export interface MatchTeam {
  label: string;
  players: MatchResultPlayer[];
  wins: boolean;
}

/** Computed team averages from match + profile data. · refs: none */
export interface TeamAverages {
  avgLevel: string;
  avgEloPlus: string;
  avgWinRate: string;
  avgWinRateValue: number | null;
  avgKDA: string;
}

/** Banned champion with resolved name. · refs: none */
export interface ResolvedBan {
  banSlot: number;
  championId: number;
  championName: string | null | undefined;
}

/** Score block data. · refs: none */
export interface ScoreBlockData {
  team1Label: string;
  team1Score: number | null;
  team2Label: string;
  team2Score: number | null;
  team1Wins: boolean;
  team2Wins: boolean;
}
