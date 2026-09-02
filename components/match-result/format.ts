/**
 * Formatting helpers for match-result components.
 * Centralized stat math, number formatting, and team average computation.
 */

import type { MatchPlayerDetail, MatchFactPlayer } from "@/lib/api-client";
import type { MatchResultPlayer, PlayerProfileData, TeamAverages } from "./types";

/* ── Damage math (preserves recovered-match guard) ── */

export function computeDamageStats(p: MatchPlayerDetail) {
  // The API's total player damage is stored in the historical
  // `damage_done_physical` field. Magical and in-hand values are optional
  // breakdown fields already included in that total.
  const totalDamage = p.damage_done_physical;
  const weaponDamage = p.damage_done_in_hand ?? 0;

  // Recovered matches can be reconstructed from player history / recovery
  // endpoints that do not include `Damage_Done_In_Hand`. In that case total
  // damage is still useful for DPM and rankings, but the weapon-vs-ability
  // split is unknown. No partial recovered field can make that split
  // trustworthy, so recovered rows report total damage/DPM only.
  const hasWeaponBreakdown = p.source !== "recovered" && p.damage_done_in_hand != null;
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
 * Returns: `null`
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
 * Format KBM tier label for display.
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
    avgKDA: kdaCount > 0 ? formatNumber(kdaSum / kdaCount, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—",
  };
}
