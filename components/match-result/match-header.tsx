"use client";

import type { ResolvedBan, ScoreBlockData } from "./types";

interface MatchHeaderProps {
  matchId: number;
  queueLabel: string;
  isRanked: boolean;
  map: string;
  duration: string;
  timestamp: string;
  region: string;
  team1Wins: boolean;
  team2Wins: boolean;
  team1Score: number;
  team2Score: number;
  broken: boolean;
  recovered: boolean;
  private: boolean;
}

export default function MatchHeader({
  matchId, queueLabel, isRanked, map, duration, timestamp, region,
  team1Wins, team2Wins, team1Score, team2Score, broken, recovered, private: isPrivate,
}: MatchHeaderProps) {
  return (
    <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-pc-text flex items-center gap-2 flex-wrap">
            Match #{matchId}
            {isRanked && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Ranked</span>
            )}
            {!isRanked && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">Casual</span>
            )}
            {broken && !recovered && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Broken</span>
            )}
            {recovered && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Recovered</span>
            )}
            {isPrivate && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">Private</span>
            )}
            <span className="text-sm font-normal text-pc-text-secondary">{queueLabel} · {map} · {region}</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className={`text-center px-3 py-1.5 rounded-lg ${team1Wins ? "bg-green-500/10 border border-green-500/30" : "bg-pc-bg-secondary"}`}>
            <div className="text-[10px] text-pc-text-muted">Team 1</div>
            <div className={`text-xl font-bold ${team1Wins ? "text-green-400" : "text-pc-text"}`}>{team1Score}</div>
          </div>
          <div className="text-pc-text-muted text-sm">vs</div>
          <div className={`text-center px-3 py-1.5 rounded-lg ${team2Wins ? "bg-green-500/10 border border-green-500/30" : "bg-pc-bg-secondary"}`}>
            <div className="text-[10px] text-pc-text-muted">Team 2</div>
            <div className={`text-xl font-bold ${team2Wins ? "text-green-400" : "text-pc-text"}`}>{team2Score}</div>
          </div>
        </div>
        <div className="text-right text-sm text-pc-text-secondary shrink-0">
          <div>{duration}</div>
          <div>{timestamp}</div>
        </div>
      </div>
    </div>
  );
}
