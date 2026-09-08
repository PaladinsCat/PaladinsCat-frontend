/**
 * Estimate team-one and team-two percentages from valid queue Elo and profile win rates. Require min(3, team size) Elo observations per team or return null; blend 85% Elo with 15% win-rate probability, clamp to 15-85%, and round complementary percentages.
 * Formats live team estimates for display.
 * refs: none
 */
/**
 * Describe live team estimate player with task_force (optional), queue_elo (optional), profile_win_rate (optional).
 * refs: none
 */
export interface LiveTeamEstimatePlayer {
  task_force?: unknown;
  queue_elo?: unknown;
  profile_win_rate?: unknown;
}

/**
 * Describe live team win chance with teamOne, teamTwo.
 * refs: none
 */
export interface LiveTeamWinChance {
  teamOne: number;
  teamTwo: number;
}

function numericMetric(value: unknown): number | null {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

/**
 * Estimate team-one and team-two percentages from valid queue Elo and profile win rates. Require min(3, team size) Elo observations per team or return null; blend 85% Elo with 15% win-rate probability, clamp to 15-85%, and round complementary percentages.
 * refs: none
 * I/O types: `players: readonly LiveTeamEstimatePlayer[] -> LiveTeamWinChance | null`.
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
