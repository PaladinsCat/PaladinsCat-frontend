/**
 * Renders team matchup data for match-result views.
 * Keeps the component's interaction and accessibility behavior intact.
 * refs: none
 */
"use client";

import type { MatchResultPlayer, TeamAverages } from "./types";
import MatchupCard from "./matchup-card";
import { matchPlayerKey } from "./player-identity";
import { useLocalization } from "@/lib/localization-context";

interface TeamMatchupProps {
  players: MatchResultPlayer[];
  label: string;
  averages: TeamAverages;
}

/** Render TeamMatchup from its declared props and match data.
 * Contract: consumes the declared props, preserves event and accessibility behavior, and returns the corresponding UI element.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function TeamMatchup({ players, label, averages }: TeamMatchupProps) {
  const { t } = useLocalization();
  return (
    <div>
      <h3 className="px-3 py-2 text-sm font-bold text-pc-text">{label}</h3>

      {/* Player cards in a responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 p-3">
        {players.map((p) => (
          <MatchupCard key={matchPlayerKey(p.matchData)} player={p} />
        ))}
      </div>

      {/* Team averages */}
      <div className={`mx-3 mb-3 rounded-lg border border-pc-border bg-pc-bg-secondary p-3`}>
        <div className="text-xs uppercase tracking-wider text-pc-text-muted mb-2 font-semibold">{t("generated.matches.teamAverages")}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center">
          <div>
            <div className="text-xs text-pc-text-muted">{t("generated.matches.avgLevel")}</div>
            <div className="text-sm font-semibold text-pc-text">{averages.avgLevel}</div>
          </div>
          <div>
            <div className="text-xs text-pc-text-muted">{t("generated.matches.avgWr")}</div>
            <div className="text-sm font-semibold text-pc-text">{averages.avgWinRate}</div>
          </div>
          <div>
            <div className="text-xs text-pc-text-muted">{t("generated.matches.avgPlayerElo")}</div>
            <div className="text-sm font-semibold text-pc-text">{averages.avgEloPlus}</div>
          </div>
          <div>
            <div className="text-xs text-pc-text-muted">{t("generated.matches.avgKda")}</div>
            <div className="text-sm font-semibold text-pc-text">{averages.avgKDA}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
