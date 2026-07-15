const LEVEL_50_XP = 25_500_000;
const XP_PER_LEVEL_AFTER_50 = 1_000_000;

/**
 * Converts total Champion XP into the in-game Champion Mastery level.
 * The curve is L × (L + 1) × 10,000 through level 49, then 1,000,000 XP
 * for each level beginning at level 50.
 */
export function championMasteryLevelFromXp(xp: number): number {
  const totalXp = Math.max(0, Number.isFinite(xp) ? xp : 0);
  if (totalXp >= LEVEL_50_XP) {
    return 50 + Math.floor((totalXp - LEVEL_50_XP) / XP_PER_LEVEL_AFTER_50);
  }

  return Math.floor((Math.sqrt(1 + totalXp / 2_500) - 1) / 2);
}
