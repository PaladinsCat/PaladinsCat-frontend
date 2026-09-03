/** Formats live team estimates for display.
 * The module preserves the existing validation, storage, formatting, or asset boundary.
 * refs: none
 */
export interface LiveTeamEstimatePlayer {
  task_force?: unknown;
  queue_elo?: unknown;
  profile_win_rate?: unknown;
}

export interface LiveTeamWinChance {
  teamOne: number;
  teamTwo: number;
}

function numericMetric(value: unknown): number | null {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

/** Apply estimateLiveTeamWinChance to the declared input values.
 * Contract: returns the module-specific validated, stored, formatted, or resolved value without external side effects.
 * Returns: `null`
 * refs: none
 */
export function estimateLiveTeamWinChance(
  players: readonly LiveTeamEstimatePlayer[],
): LiveTeamWinChance | null {
  const teamMetrics = (taskForce: number) => {
    const team = players.filter((player) => Number(player.task_force) === taskForce);
    const elos = team.flatMap((player) => {
      const value = numericMetric(player.queue_elo);
      return value != null && value > 0 && value <= 3500 ? [value] : [];
    });
    const winRates = team.flatMap((player) => {
      const value = numericMetric(player.profile_win_rate);
      return value != null && value >= 0 && value <= 100 ? [value] : [];
    });
    const minimumCoverage = Math.min(3, team.length);
    return {
      averageElo: elos.length >= minimumCoverage
        ? elos.reduce((sum, value) => sum + value, 0) / elos.length
        : null,
      averageWinRate: winRates.length >= minimumCoverage
        ? winRates.reduce((sum, value) => sum + value, 0) / winRates.length
        : null,
    };
  };

  const teamOne = teamMetrics(1);
  const teamTwo = teamMetrics(2);
  if (teamOne.averageElo == null || teamTwo.averageElo == null) return null;

  const eloProbability = 1 / (1 + 10 ** ((teamTwo.averageElo - teamOne.averageElo) / 400));
  const winRateProbability = teamOne.averageWinRate != null && teamTwo.averageWinRate != null
    ? teamOne.averageWinRate / (teamOne.averageWinRate + teamTwo.averageWinRate || 100)
    : 0.5;
  const blended = Math.min(0.85, Math.max(0.15, eloProbability * 0.85 + winRateProbability * 0.15));
  const teamOnePercent = Math.round(blended * 100);
  return { teamOne: teamOnePercent, teamTwo: 100 - teamOnePercent };
}
