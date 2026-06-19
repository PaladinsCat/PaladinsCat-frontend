"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { fetchPlayerMatches, type MatchRecord } from "@/lib/api-client";

interface PlayerData {
  id: string;
  name: string;
  level: number;
  wins: number;
  losses: number;
  region: string;
  platform: string;
  kbm_tier: number;
  kbm_points: number;
  kbm_wins: number;
  kbm_losses: number;
  mastery_level: number;
  total_matches: number;
  total_wins: number;
  total_losses: number;
  avg_egpm: number | null;
  avg_dpm: number | null;
  avg_hpm: number | null;
  avg_shpm: number | null;
  avg_mpm: number | null;
  cheater: boolean;
  sus_count: number;
  last_seen: string;
  first_seen: string;
}

interface QueueRating {
  queue_id: number;
  mu: number;
  phi: number;
  volatility: number;
  matches_played: number;
  wins: number;
  losses: number;
}

interface ChampionRating {
  champion_id: number;
  champion_name: string;
  mu: number;
  phi: number;
  matches_played: number;
  wins: number;
  losses: number;
}

interface PlayerResponse {
  player: PlayerData;
  queueRatings: QueueRating[];
  championRatings: ChampionRating[];
}

interface ChampionStat {
  champion_id: number;
  champion_name: string;
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_kills: number;
  avg_deaths: number;
  avg_assists: number;
  avg_damage: number;
  avg_healing: number;
  avg_mitigation: number;
  kda: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3304";

const TIER_NAMES: Record<number, string> = {
  0: "Unranked", 1: "Bronze V", 2: "Bronze IV", 3: "Bronze III", 4: "Bronze II", 5: "Bronze I",
  6: "Silver V", 7: "Silver IV", 8: "Silver III", 9: "Silver II", 10: "Silver I",
  11: "Gold V", 12: "Gold IV", 13: "Gold III", 14: "Gold II", 15: "Gold I",
  16: "Platinum V", 17: "Platinum IV", 18: "Platinum III", 19: "Platinum II", 20: "Platinum I",
  21: "Diamond V", 22: "Diamond IV", 23: "Diamond III", 24: "Diamond II", 25: "Diamond I",
  26: "Master", 27: "Grandmaster",
};

const TIER_COLORS: Record<number, string> = {
  0: "text-pc-text-muted", 1: "text-amber-700", 6: "text-gray-300", 11: "text-yellow-400",
  16: "text-sky-400", 21: "text-violet-400", 26: "text-emerald-400", 27: "text-rose-400",
};

function getTierColor(tier: number): string {
  if (tier >= 27) return TIER_COLORS[27];
  if (tier >= 26) return TIER_COLORS[26];
  if (tier >= 21) return TIER_COLORS[21];
  if (tier >= 16) return TIER_COLORS[16];
  if (tier >= 11) return TIER_COLORS[11];
  if (tier >= 6) return TIER_COLORS[6];
  if (tier >= 1) return TIER_COLORS[1];
  return TIER_COLORS[0];
}

function formatNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString();
}

function formatKDA(kills: number, deaths: number, assists: number): string {
  if (deaths === 0) return (kills + assists).toFixed(1);
  return ((kills + assists) / deaths).toFixed(2);
}

export default function PlayerProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [response, setResponse] = useState<PlayerResponse | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`${API_BASE}/players/${id}`).then((r) => r.json()),
      fetchPlayerMatches(id, { limit: "20" }).catch(() => []),
    ])
      .then(([profileData, matchData]) => {
        if (cancelled) return;
        setResponse(profileData);
        setMatches(matchData);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load player profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-pc-text-muted text-sm">Loading player profile...</div>
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-pc-text-muted text-sm">{error || "Player not found"}</div>
        <Link href="/players" className="text-pc-accent text-sm hover:underline">← Back to Players</Link>
      </div>
    );
  }

  const { player, queueRatings, championRatings } = response;
  const winRate = player.total_matches > 0 ? (player.total_wins / player.total_matches) * 100 : 0;
  const kbmRating = queueRatings.find((r) => r.queue_id === 486);
  const kbmMu = kbmRating ? Number(kbmRating.mu) : null;
  const tierName = TIER_NAMES[player.kbm_tier] || "Unranked";
  const tierColor = getTierColor(player.kbm_tier);

  // Top champions by matches played

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/players" className="text-pc-text-secondary hover:text-pc-accent transition-colors text-sm">
        ← Back to Players
      </Link>

      {/* Header */}
      <div className="pc-card">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-xl bg-pc-bg border-2 border-pc-accent/30 flex items-center justify-center shrink-0">
            <span className="text-3xl font-bold text-pc-accent">{player.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-pc-text truncate">{player.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`text-xs font-semibold ${tierColor}`}>{tierName}</span>
              {player.kbm_points > 0 && (
                <span className="text-[10px] text-pc-text-muted font-mono">{player.kbm_points} TP</span>
              )}
              <span className="text-pc-border">·</span>
              <span className="text-xs text-pc-text-muted">{player.region}</span>
              <span className="text-pc-border">·</span>
              <span className="text-xs text-pc-text-muted">{player.platform}</span>
              <span className="text-pc-border">·</span>
              <span className="text-xs text-pc-text-muted">Lvl {player.level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column: Recent Matches + Rating/Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Matches (2/3) */}
        <div className="lg:col-span-2">
          <h2 className="pc-card-title shadow-sm">Recent Matches</h2>
          <div className="pc-card">
            {matches.length === 0 ? (
              <p className="text-pc-text-muted text-sm">No matches recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-pc-border text-pc-text-muted text-left text-xs">
                      <th className="px-3 py-2">Match</th>
                      <th className="px-3 py-2">Champion</th>
                      <th className="px-3 py-2">K</th>
                      <th className="px-3 py-2">D</th>
                      <th className="px-3 py-2">A</th>
                      <th className="px-3 py-2">KDA</th>
                      <th className="px-3 py-2">DPM</th>
                      <th className="px-3 py-2">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m) => {
                      const dpm = m.duration > 0 ? ((m.damageDone / m.duration) * 60).toFixed(0) : "—";
                      const kda = formatKDA(m.kills, m.deaths, m.assists);
                      return (
                        <tr key={m.matchId} className="border-b border-pc-border/30 hover:bg-pc-bg-secondary/50 transition-colors">
                          <td className="px-3 py-2">
                            <Link href={`/matches/${m.matchId}`} className="text-pc-accent hover:text-pc-accent-secondary text-xs font-mono">
                              #{m.matchId}
                            </Link>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <img src={getChampionIconSafe(m.championName)} alt={m.championName} className="w-5 h-5 rounded object-contain" />
                              <span className="text-xs text-pc-text">{m.championName}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs font-mono text-pc-text">{m.kills}</td>
                          <td className="px-3 py-2 text-xs font-mono text-pc-text">{m.deaths}</td>
                          <td className="px-3 py-2 text-xs font-mono text-pc-text">{m.assists}</td>
                          <td className="px-3 py-2 text-xs font-mono text-pc-text">{kda}</td>
                          <td className="px-3 py-2 text-xs font-mono text-pc-text-muted">{dpm}</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs font-medium ${m.isWinner ? "text-emerald-400" : "text-rose-400"}`}>
                              {m.isWinner ? "W" : "L"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Rating & Performance (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h2 className="pc-card-title shadow-sm">Rating</h2>
            <div className="pc-card">
              {kbmRating ? (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pc-accent font-mono">{Number(kbmRating.mu).toFixed(0)}</div>
                    <div className="text-[10px] text-pc-text-muted mt-1">Glicko-2 Rating</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="pc-surface-light rounded p-2 border border-pc-border/50">
                      <div className="text-xs text-pc-text-muted">Deviation</div>
                      <div className="text-sm font-mono text-pc-text">{Number(kbmRating.phi).toFixed(0)}</div>
                    </div>
                    <div className="pc-surface-light rounded p-2 border border-pc-border/50">
                      <div className="text-xs text-pc-text-muted">Volatility</div>
                      <div className="text-sm font-mono text-pc-text">{Number(kbmRating.volatility).toFixed(4)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-pc-border/50">
                    <div>
                      <div className="text-xs text-pc-text-muted">W</div>
                      <div className="text-sm font-mono text-emerald-400">{Number(kbmRating.wins)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-pc-text-muted">L</div>
                      <div className="text-sm font-mono text-rose-400">{Number(kbmRating.losses)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-pc-text-muted">WR</div>
                      <div className="text-sm font-mono text-pc-text">
                        {kbmRating.matches_played > 0 ? ((Number(kbmRating.wins) / Number(kbmRating.matches_played)) * 100).toFixed(0) : "—"}%
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-pc-text-muted text-sm text-center py-4">No ranked rating yet</p>
              )}
            </div>
          </div>

          {/* Derived Metrics */}
          <div>
            <h2 className="pc-card-title shadow-sm">Performance</h2>
            <div className="pc-card">
              <div className="space-y-2">
                {[
                  { label: "Damage / Min", value: player.avg_dpm, color: "text-red-400" },
                  { label: "Healing / Min", value: player.avg_hpm, color: "text-emerald-400" },
                  { label: "Mitigation / Min", value: player.avg_mpm, color: "text-sky-400" },
                  { label: "Credits / Min", value: player.avg_egpm, color: "text-yellow-400" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-xs text-pc-text-muted">{m.label}</span>
                    <span className={`text-sm font-mono font-medium ${m.value != null ? m.color : "text-pc-text-muted"}`}>
                      {formatNumber(m.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
