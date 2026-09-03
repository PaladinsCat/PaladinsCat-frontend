/**
 * Team averages — extracted from team-matchup for standalone use.
 * Computed averages are in format.ts → computeTeamAverages.
 * refs: none
 */
import type { MatchResultPlayer, TeamAverages } from "./types";
import { LocalizedText } from "@/lib/localization-context";

/** Render TeamAverages from its declared props and match data.
 * Contract: consumes the declared props, preserves event and accessibility behavior, and returns the corresponding UI element.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function TeamAverages({ averages }: { averages: TeamAverages }) {
  return (
    <div className="flex flex-wrap gap-4 justify-center text-center">
      <div>
        <div className="text-xs uppercase text-pc-text-muted"><LocalizedText id="generated.matches.avgLevel" /></div>
        <div className="text-sm font-semibold text-pc-text">{averages.avgLevel}</div>
      </div>
      <div>
        <div className="text-xs uppercase text-pc-text-muted"><LocalizedText id="generated.matches.avgPlayerElo" /></div>
        <div className="text-sm font-semibold text-pc-text">{averages.avgEloPlus}</div>
      </div>
    </div>
  );
}
