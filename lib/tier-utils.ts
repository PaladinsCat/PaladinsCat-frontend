/** Tier / rank display logic — shared between profile and leaderboards. */

export const TIER_NAMES: Record<number, string> = {
  0: "Unranked", 1: "Bronze V", 2: "Bronze IV", 3: "Bronze III", 4: "Bronze II", 5: "Bronze I",
  6: "Silver V", 7: "Silver IV", 8: "Silver III", 9: "Silver II", 10: "Silver I",
  11: "Gold V", 12: "Gold IV", 13: "Gold III", 14: "Gold II", 15: "Gold I",
  16: "Platinum V", 17: "Platinum IV", 18: "Platinum III", 19: "Platinum II", 20: "Platinum I",
  21: "Diamond V", 22: "Diamond IV", 23: "Diamond III", 24: "Diamond II", 25: "Diamond I",
  26: "Master", 27: "Grandmaster",
};

export const TIER_COLORS: Record<number, string> = {
  0: "text-pc-text-muted", 1: "text-amber-700", 6: "text-gray-300", 11: "text-yellow-400",
  16: "text-sky-400", 21: "text-violet-400", 26: "text-emerald-400", 27: "text-rose-400",
};

/** Get the Tailwind text color class for a tier. */
export function getTierColor(tier: number): string {
  if (tier >= 27) return TIER_COLORS[27];
  if (tier >= 26) return TIER_COLORS[26];
  if (tier >= 21) return TIER_COLORS[21];
  if (tier >= 16) return TIER_COLORS[16];
  if (tier >= 11) return TIER_COLORS[11];
  if (tier >= 6) return TIER_COLORS[6];
  if (tier >= 1) return TIER_COLORS[1];
  return TIER_COLORS[0];
}

/**
 * Resolve the effective display tier from kbm_tier + kbm_rank.
 *
 * Grandmaster logic: top 100 Masters (rank 1-100) display as Grandmaster.
 * Masters ranked 101+ are offset by 100 and display as Master with the
 * adjusted rank (e.g. rank 101 → Master #1).
 */
export function resolveEffectiveTier(kbmTier: number, kbmRank: number): {
  displayTier: number;
  displayName: string;
  displayRank: number;
  isGrandmaster: boolean;
} {
  if (kbmTier === 26) {
    if (kbmRank <= 100) {
      return {
        displayTier: 27,
        displayName: "Grandmaster",
        displayRank: kbmRank,
        isGrandmaster: true,
      };
    }
    return {
      displayTier: 26,
      displayName: "Master",
      displayRank: kbmRank - 100,
      isGrandmaster: false,
    };
  }
  return {
    displayTier: kbmTier,
    displayName: TIER_NAMES[kbmTier] || "Unranked",
    displayRank: kbmRank,
    isGrandmaster: false,
  };
}

/**
 * Build the rank tier icon path from kbm_tier + kbm_rank.
 * Uses resolveEffectiveTier so Grandmaster logic is consistent.
 *
 * Path structure:
 *   rank-tiers/qualifying/RankIcon_Qualifying.avif   — tier 0
 *   rank-tiers/bronze/RankIcon_Bronze_1.avif          — tiers 1-5
 *   rank-tiers/silver/RankIcon_Silver_1.avif          — tiers 6-10
 *   rank-tiers/gold/RankIcon_Gold_1.avif              — tiers 11-15
 *   rank-tiers/platinum/RankIcon_Platinum_1.avif      — tiers 16-20
 *   rank-tiers/diamond/RankIcon_Diamond_1.avif        — tiers 21-25
 *   rank-tiers/master/RankIcon_Master.avif            — tier 26
 *   rank-tiers/grandmaster/RankIcon_Grandmaster.avif  — tier 27
 */
export function getRankIconPath(kbmTier: number, kbmRank: number): string {
  const { displayTier } = resolveEffectiveTier(kbmTier, kbmRank);

  const tierMap: Record<number, { folder: string; base: string }> = {
    0: { folder: "qualifying", base: "RankIcon_Qualifying" },
    26: { folder: "master", base: "RankIcon_Master" },
    27: { folder: "grandmaster", base: "RankIcon_Grandmaster" },
  };

  if (tierMap[displayTier]) {
    return `/images/rank-tiers/${tierMap[displayTier].folder}/${tierMap[displayTier].base}.avif`;
  }

  // Tiers 1-25: sub-tier (1-5), inverted — tier 1 = sub 5 (V), tier 5 = sub 1 (I)
  const sub = 5 - (displayTier - 1) % 5;
  const folderMap: Record<number, string> = {
    1: "bronze", 2: "silver", 3: "gold", 4: "platinum", 5: "diamond",
  };
  const baseMap: Record<number, string> = {
    1: "Bronze", 2: "Silver", 3: "Gold", 4: "Platinum", 5: "Diamond",
  };
  const group = Math.floor((displayTier - 1) / 5);
  const folder = folderMap[group] || "bronze";
  const base = baseMap[group] || "Bronze";
  return `/images/rank-tiers/${folder}/RankIcon_${base}_${sub}.avif`;
}
