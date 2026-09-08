/**
 * Paladins KDA: kills plus half an assist, divided by deaths.
 * Deathless matches use 1 as the denominator instead of displaying Infinity.
 * Returns: `number`
 * refs: none
 */
/**
 * Compute (kills + assists / 2) / max(deaths, 1), treating falsy combat totals as zero so deathless matches remain finite.
 * I/O types: `kills: number; deaths: number; assists: number -> number`.
 * refs: none
 */
export function calculateKda(kills: number, deaths: number, assists: number): number {
  const numerator = Number(kills || 0) + Number(assists || 0) / 2;
  return numerator / Math.max(Number(deaths || 0), 1);
}

/**
 * Format (kills + assists / 2) / max(deaths, 1) to two decimal places using calculateKda.
 * refs: none
 * I/O types: `kills: number; deaths: number; assists: number -> string`.
 */
export function formatKda(kills: number, deaths: number, assists: number): string {
  return calculateKda(kills, deaths, assists).toFixed(2);
}
