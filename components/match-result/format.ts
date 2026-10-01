/**
 * Formatting helpers for match-result components.
 * Centralized stat math, number formatting, and team average computation.
 * refs: none
 */

import type { MatchPlayerDetail, MatchFactPlayer } from "@/lib/api-client";
import type { MatchResultPlayer, PlayerProfileData, TeamAverages } from "./types";

/* ── Damage math ── */

/**
 * Compute total and per-minute damage from one match player. Treat damage_done_physical as the total; expose weapon/ability breakdown only when the canonical availability tag confirms that Hi-Rez supplied it, returning null for unavailable shares or rates and guarding zero duration.
 * I/O types: `p: MatchPlayerDetail -> { totalDamage: number; weaponDamage: number; nonWeaponDamage: number | null; weaponShare: number | null; weaponPerMinute: number | null; abilityPerMinute: number | null; hasWeaponBreakdown: boolean; }`.
 * refs: doc: documents/06-reference/routes/frontend-match-detail.md
 */
export function computeDamageStats(p: MatchPlayerDetail) {
  // The API's total player damage is stored in the historical
  // `damage_done_physical` field. Magical and in-hand values are optional
  // breakdown fields already included in that total.
  const totalDamage = p.damage_done_physical;
  const weaponDamage = p.damage_done_in_hand ?? totalDamage;

  // Explicit zero is valid. The separate tag prevents a missing provider
  // field from being mistaken for zero weapon damage and all skill damage.
  const hasWeaponBreakdown = p.damage_breakdown_available === true;
  const nonWeaponDamage = hasWeaponBreakdown
    ? Math.max(totalDamage - weaponDamage, 0)
    : null;
  const weaponShare =
    hasWeaponBreakdown && totalDamage > 0
      ? (weaponDamage / totalDamage) * 100
      : null;
  const minutes = p.time_in_match > 0 ? p.time_in_match / 60 : 0;
  const weaponPerMinute = hasWeaponBreakdown && minutes > 0
    ? weaponDamage / minutes
    : null;
  const abilityPerMinute = nonWeaponDamage != null && minutes > 0
    ? nonWeaponDamage / minutes
    : null;

  return {
    totalDamage,
    weaponDamage,
    nonWeaponDamage,
    weaponShare,
    weaponPerMinute,
    abilityPerMinute,
    hasWeaponBreakdown,
  };
}

/* ── Player profile helpers ── */

/**
 * Get champion-specific stats from player profile, or null if not found.
 * refs: none
 * I/O types: `profile: PlayerProfileData | null | undefined; championName: string | null | undefined -> { championName: string; wins: number; totalPlays: number; winRate: number; } | null`.
 */
export function getChampionStats(
  profile: PlayerProfileData | null | undefined,
  championName: string | null | undefined,
) {
  if (!profile || !championName) return null;
  const tc = profile.topChampions.find(
    (c) => c.championName === championName,
  );
  if (!tc) return null;
  return {
    championName: tc.championName,
    wins: tc.wins,
    totalPlays: tc.totalPlays,
    winRate: tc.winRate,
  };
}

/**
 * Compute display-ready team averages for profile level, queue Elo, global profile win rate, and match KDA using finite observations and the supplied formatters. Return em-dash placeholders for missing metrics and null for the numeric win-rate mean when unavailable.
 * refs: doc: documents/06-reference/routes/frontend-match-detail.md
 * I/O types: `players: MatchResultPlayer[]; formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string; formatPercent: (value: number) => string -> TeamAverages`.
 */
/* ── Team averages ── */

export function computeTeamAverages(
  players: MatchResultPlayer[],
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string,
  formatPercent: (value: number) => string,
): TeamAverages {
  if (players.length === 0) {
    return {
      avgLevel: "—",
      avgEloPlus: "—",
      avgWinRate: "—",
      avgWinRateValue: null,
      avgKDA: "—",
    };
  }

  // KDA average
  let kdaSum = 0;
  let kdaCount = 0;

  // Global in-game win rate (from Hi-Rez profile wins/losses, not tracked matches).
  let winRateSum = 0;
  let winRateCount = 0;

  // Account level is profile data; it is unrelated to the ranked tier.
  let levelSum = 0;
  let levelCount = 0;

  for (const p of players) {
    const md = p.matchData;

    // KDA
    if (Number.isFinite(md.kda)) { kdaSum += md.kda; kdaCount++; }

    // Profile-based stats
    if (p.profileData) {
      if (p.profileData.level != null && Number.isFinite(p.profileData.level)) {
        levelSum += p.profileData.level;
        levelCount++;
      }
      if (p.profileData.globalWinRate != null && Number.isFinite(p.profileData.globalWinRate)) {
        winRateSum += p.profileData.globalWinRate;
        winRateCount++;
      }
    }
  }

  return {
    avgLevel: levelCount > 0 ? formatNumber(levelSum / levelCount, { maximumFractionDigits: 0 }) : "—",
    avgEloPlus: (() => {
      const values = players.map((player) => player.profileData?.queueElo).filter((value): value is number => value != null && Number.isFinite(value));
      return values.length > 0 ? formatNumber(values.reduce((sum, value) => sum + value, 0) / values.length, { maximumFractionDigits: 0 }) : "—";
    })(),
    // globalWinRate is already expressed in percentage points (0–100).
    avgWinRate: winRateCount > 0 ? formatPercent(winRateSum / winRateCount) : "—",
    avgWinRateValue: winRateCount > 0 ? winRateSum / winRateCount : null,
    avgKDA: kdaCount > 0 ? formatNumber(kdaSum / kdaCount, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—",
  };
}
