/**
 * Shared types for the match-result component tree.
 * All calculation/formatting logic lives in format.ts — these are pure shapes.
 */

import type {
  MatchPlayerDetail,
  MatchFactPlayer,
  MatchBan,
  RatingSnapshot,
} from "@/lib/api-client";

/** Enriched player with optional profile data for the matchup cards. */
export interface MatchResultPlayer {
  matchData: MatchPlayerDetail;
  factData?: MatchFactPlayer;
  profileData?: PlayerProfileData | null;
}

/** Slim profile shape returned by GET /api/players/:id */
export interface PlayerProfileData {
  id: string;
  name: string;
  level: number | null;
  platform: string;
  region: string;
  kbmTier: string | null;
  kbmPoints: number | null;
  kbmRank?: number | null;
  queueElo?: number | null;
  championElo?: number | null;
  globalWins?: number | null;
  globalLosses?: number | null;
  globalWinRate?: number | null;
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

/** Map from player_id → profile, keyed by string (API returns string IDs at runtime). */
export type ProfileByPlayerId = Map<string, PlayerProfileData>;

/** Map from player_id → fact data, keyed by string (API returns string IDs at runtime). */
export type FactByPlayerId = Map<string, MatchFactPlayer>;

/** Team grouping with identity. */
export interface MatchTeam {
  label: string;
  players: MatchResultPlayer[];
  wins: boolean;
}

/** Computed team averages from match + profile data. */
export interface TeamAverages {
  avgLevel: string;
  avgEloPlus: string;
  avgWinRate: string;
  avgKDA: string;
}

/** Banned champion with resolved name. */
export interface ResolvedBan {
  banSlot: number;
  championId: number;
  championName: string | null | undefined;
}

/** Score block data. */
export interface ScoreBlockData {
  team1Label: string;
  team1Score: number | null;
  team2Label: string;
  team2Score: number | null;
  team1Wins: boolean;
  team2Wins: boolean;
}
