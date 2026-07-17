"use client";

import { useState } from "react";
import type { MatchResultPlayer } from "./types";
import { computeTeamAverages } from "./format";
import TeamMatchup from "./team-matchup";
import { useLocalization } from "@/lib/localization-context";

interface MatchupSectionProps {
  team1: MatchResultPlayer[];
  team2: MatchResultPlayer[];
  team1Wins: boolean;
  team2Wins: boolean;
  team1Label: string;
  team2Label: string;
}

export default function MatchupSection({
  team1, team2, team1Wins, team2Wins, team1Label, team2Label,
}: MatchupSectionProps) {
  const { t } = useLocalization();
  const [sortBy, setSortBy] = useState(t("generated.match.matchup.playerName"));
  const averages1 = computeTeamAverages(team1);
  const averages2 = computeTeamAverages(team2);

  const sortOptions = [t("generated.match.matchup.playerName"), t("generated.match.matchup.tier"), "TP", "W/L"];
  const ordered = (players: MatchResultPlayer[]) => [...players].sort((a, b) => {
    if (sortBy === t("generated.match.matchup.tier")) return String(b.matchData.league_tier ?? "").localeCompare(String(a.matchData.league_tier ?? ""), undefined, { numeric: true });
    if (sortBy === "TP") return (b.profileData?.kbmPoints ?? -1) - (a.profileData?.kbmPoints ?? -1);
    if (sortBy === "W/L") return (b.profileData?.winRate ?? -1) - (a.profileData?.winRate ?? -1);
    return (a.matchData.player_name ?? "").localeCompare(b.matchData.player_name ?? "");
  });

  return (
    <section className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 sm:p-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-pc-text uppercase tracking-wide">{t("generated.matches.playerMatchup")}</h2>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs bg-pc-bg-secondary border border-pc-border rounded-md px-2 py-1 text-pc-text-secondary cursor-pointer hover:border-pc-accent transition-colors"
          >
            {sortOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Team 1 */}
      <div className="mb-2">
        <TeamMatchup players={ordered(team1)} label={team1Label} averages={averages1} />
      </div>

      {/* VS divider */}
      <div className="flex items-center justify-center py-3">
        <div className="flex-1 h-px bg-pc-border" />
        <span className="px-4 text-pc-text-muted font-bold text-lg">{t("generated.matches.vs")}</span>
        <div className="flex-1 h-px bg-pc-border" />
      </div>

      {/* Team 2 */}
      <div>
        <TeamMatchup players={ordered(team2)} label={team2Label} averages={averages2} />
      </div>

    </section>
  );
}
