/**
 * Paladins KDA: kills plus half an assist, divided by deaths.
 * Deathless matches use 1 as the denominator instead of displaying Infinity.
 */
export function calculateKda(kills: number, deaths: number, assists: number): number {
  const numerator = Number(kills || 0) + Number(assists || 0) / 2;
  return numerator / Math.max(Number(deaths || 0), 1);
}

/** Apply formatKda to the declared input values.
 * Contract: returns the module-specific validated, stored, formatted, or resolved value without external side effects.
 */
export function formatKda(kills: number, deaths: number, assists: number): string {
  return calculateKda(kills, deaths, assists).toFixed(2);
}
