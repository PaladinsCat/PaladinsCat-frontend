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
  hours_played: number;
  minutes_played: number;
  mastery_level: number;
  region: string;
  platform: string;
  total_xp: string;
  total_worshippers: string;
  total_achievements: number;
  avatar_id: number;
  avatar_url: string;
  title: string;
  loading_frame: string;
  created_datetime: string;
  last_login_datetime: string;
  personal_status_message: string;
  privacy_flag: string;
  kbm_points: number;
  kbm_tier: number;
  kbm_season: number;
  kbm_wins: number;
  kbm_losses: number;
  kbm_rank: number;
  kbm_name: string;
  kbm_leaves: number;
  kbm_trend: number;
  kbm_prev_rank: number;
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
  platform_name: string;
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

function formatLargeNumber(n: string | number | null | undefined): string {
  if (n == null) return "—";
  const num = typeof n === "string" ? parseInt(n, 10) : n;
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString();
}

function formatKDA(kills: number, deaths: number, assists: number): string {
  if (deaths === 0) return (kills + assists).toFixed(1);
  return ((kills + assists) / deaths).toFixed(2);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatHours(hours: number): string {
  if (!hours) return "—";
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  if (d > 0) return `${d}d ${h}h`;
  return `${h}h`;
}

function trendArrow(trend: number): string {
  if (trend > 0) return "↑";
  if (trend < 0) return "↓";
  return "—";
}

function trendColor(trend: number): string {
  if (trend > 0) return "text-emerald-400";
  if (trend < 0) return "text-rose-400";
  return "text-pc-text-muted";
}

// Inline stat row: label + value
function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-pc-text-muted">{label}</span>
      <span className={`text-xs font-mono font-medium ${color || "text-pc-text"}`}>{value}</span>
    </div>
  );
}

// Compact 2-column stat grid
function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-y-2 gap-x-4">{children}</div>;
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
  const totalMatches = player.total_matches || (player.wins + player.losses) || 0;
  const totalWins = player.total_wins || player.wins || 0;
  const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
  const kbmRating = queueRatings.find((r) => r.queue_id === 486);
  const kbmMu = kbmRating ? Number(kbmRating.mu) : null;
  const tierName = TIER_NAMES[player.kbm_tier] || "Unranked";
  const tierColor = getTierColor(player.kbm_tier);
  const kbmWr = player.kbm_wins + player.kbm_losses > 0
    ? ((player.kbm_wins / (player.kbm_wins + player.kbm_losses)) * 100).toFixed(1)
    : "—";

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link href="/players" className="text-pc-text-secondary hover:text-pc-accent transition-colors text-sm">
        ← Back to Players
      </Link>

      {/* ── Header ── */}
      <div className="pc-card">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-xl border-2 border-pc-accent/30 overflow-hidden shrink-0 bg-pc-bg flex items-center justify-center">
            {player.avatar_url ? (
              <img
                src={player.avatar_url}
                alt={player.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-2xl font-bold text-pc-accent">${player.name.charAt(0).toUpperCase()}</span>`;
                }}
              />
            ) : (
              <span className="text-2xl font-bold text-pc-accent">{player.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-pc-text truncate">{player.name}</h1>
              {player.cheater && (
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">CHEATER</span>
              )}
              {player.sus_count > 0 && !player.cheater && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">SUSPICIOUS ({player.sus_count})</span>
              )}
            </div>
            {/* Title + loading frame */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
              {player.title && (
                <span className="text-[11px] text-pc-text-secondary" dangerouslySetInnerHTML={{ __html: player.title }} />
              )}
              {player.loading_frame && (
                <span className="text-[11px] text-pc-accent/80 font-medium">▸ {player.loading_frame}</span>
              )}
            </div>
            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className={`text-[10px] font-semibold ${tierColor} bg-pc-bg px-1.5 py-0.5 rounded`}>{tierName}</span>
              {player.kbm_points > 0 && (
                <span className="text-[10px] text-pc-text-muted font-mono">{player.kbm_points} TP</span>
              )}
              <span className="text-pc-border">·</span>
              <span className="text-[10px] text-pc-text-muted">{player.region}</span>
              <span className="text-pc-border">·</span>
              <span className="text-[10px] text-pc-text-muted">{player.platform}</span>
              {player.platform_name && (
                <span className="text-[10px] text-pc-text-muted">({player.platform_name})</span>
              )}
              <span className="text-pc-border">·</span>
              <span className="text-[10px] text-pc-text-muted">Lvl {player.level}</span>
              <span className="text-pc-border">·</span>
              <span className="text-[10px] text-pc-text-muted">Mastery {player.mastery_level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: Account + KBM + Performance (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Account Overview */}
          <div>
            <h2 className="pc-card-title shadow-sm">Account</h2>
            <div className="pc-card">
              <StatGrid>
                <StatRow label="Created" value={formatDate(player.created_datetime)} />
                <StatRow label="Last Login" value={formatDateTime(player.last_login_datetime)} />
                <StatRow label="Playtime" value={formatHours(player.hours_played)} />
                <StatRow label="Achievements" value={formatNumber(player.total_achievements)} />
                <StatRow label="Total XP" value={formatLargeNumber(player.total_xp)} />
                <StatRow label="Worshippers" value={formatLargeNumber(player.total_worshippers)} />
              </StatGrid>
              {player.personal_status_message && (
                <div className="mt-3 pt-3 border-t border-pc-border/50">
                  <span className="text-[11px] text-pc-text-muted">Status: </span>
                  <span className="text-xs text-pc-text-secondary italic">{player.personal_status_message}</span>
                </div>
              )}
            </div>
          </div>

          {/* KBM Ranked */}
          <div>
            <h2 className="pc-card-title shadow-sm">KBM Ranked</h2>
            <div className="pc-card">
              <div className="flex items-center gap-4 mb-3">
                {/* Tier display */}
                <div className="text-center">
                  <div className={`text-2xl font-bold font-mono ${tierColor}`}>{tierName}</div>
                  <div className="text-[10px] text-pc-text-muted mt-0.5">Season {player.kbm_season}</div>
                </div>
                <div className="flex-1 border-l border-pc-border/50 pl-4">
                  <StatGrid>
                    <StatRow label="Rank" value={`#${player.kbm_rank}`} color="text-pc-accent" />
                    <StatRow label="Prev Rank" value={`#${player.kbm_prev_rank}`} />
                    <StatRow label="Trend" value={`${trendArrow(player.kbm_trend)} ${Math.abs(player.kbm_trend)}`} color={trendColor(player.kbm_trend)} />
                    <StatRow label="Leaves" value={formatNumber(player.kbm_leaves)} />
                  </StatGrid>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-pc-border/50">
                <div>
                  <div className="text-[10px] text-pc-text-muted">Wins</div>
                  <div className="text-sm font-mono text-emerald-400">{player.kbm_wins}</div>
                </div>
                <div>
                  <div className="text-[10px] text-pc-text-muted">Losses</div>
                  <div className="text-sm font-mono text-rose-400">{player.kbm_losses}</div>
                </div>
                <div>
                  <div className="text-[10px] text-pc-text-muted">Win Rate</div>
                  <div className="text-sm font-mono text-pc-text">{kbmWr}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance + Overall Stats */}
          <div>
            <h2 className="pc-card-title shadow-sm">Performance</h2>
            <div className="pc-card">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <div className="text-[10px] text-pc-text-muted uppercase tracking-wider mb-2">Averages</div>
                  <div className="space-y-1.5">
                    <StatRow label="Damage / Min" value={formatNumber(player.avg_dpm)} color="text-red-400" />
                    <StatRow label="Healing / Min" value={formatNumber(player.avg_hpm)} color="text-emerald-400" />
                    <StatRow label="Mitigation / Min" value={formatNumber(player.avg_mpm)} color="text-sky-400" />
                    <StatRow label="Credits / Min" value={formatNumber(player.avg_egpm)} color="text-yellow-400" />
                    {player.avg_shpm != null && (
                      <StatRow label="Shield / Min" value={formatNumber(player.avg_shpm)} color="text-violet-400" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-pc-text-muted uppercase tracking-wider mb-2">Overall</div>
                  <div className="space-y-1.5">
                    <StatRow label="Total Matches" value={formatNumber(player.total_matches)} />
                    <StatRow label="Total Wins" value={formatNumber(player.total_wins)} color="text-emerald-400" />
                    <StatRow label="Total Losses" value={formatNumber(player.total_losses)} color="text-rose-400" />
                    <StatRow label="Win Rate" value={winRate.toFixed(1) + "%"} color={winRate >= 50 ? "text-emerald-400" : "text-rose-400"} />
                    <StatRow label="Hi-Rez W/L" value={`${player.wins} / ${player.losses}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Matches */}
          <div>
            <h2 className="pc-card-title shadow-sm">Recent Matches</h2>
            <div className="pc-card">
              {matches.length === 0 ? (
                <p className="text-pc-text-muted text-sm">No matches recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-pc-border text-pc-text-muted text-left text-xs">
                        <th className="px-3 py-1.5">Match</th>
                        <th className="px-3 py-1.5">Champion</th>
                        <th className="px-3 py-1.5">K</th>
                        <th className="px-3 py-1.5">D</th>
                        <th className="px-3 py-1.5">A</th>
                        <th className="px-3 py-1.5">KDA</th>
                        <th className="px-3 py-1.5">DPM</th>
                        <th className="px-3 py-1.5">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((m) => {
                        const dpm = m.duration > 0 ? ((m.damageDone / m.duration) * 60).toFixed(0) : "—";
                        const kda = formatKDA(m.kills, m.deaths, m.assists);
                        return (
                          <tr key={m.matchId} className="border-b border-pc-border/30 hover:bg-pc-bg-secondary/50 transition-colors">
                            <td className="px-3 py-1.5">
                              <Link href={`/matches/${m.matchId}`} className="text-pc-accent hover:text-pc-accent-secondary text-xs font-mono">
                                #{m.matchId}
                              </Link>
                            </td>
                            <td className="px-3 py-1.5">
                              <div className="flex items-center gap-1.5">
                                <img src={getChampionIconSafe(m.championName)} alt={m.championName} className="w-5 h-5 rounded object-contain" />
                                <span className="text-xs text-pc-text">{m.championName}</span>
                              </div>
                            </td>
                            <td className="px-3 py-1.5 text-xs font-mono text-pc-text">{m.kills}</td>
                            <td className="px-3 py-1.5 text-xs font-mono text-pc-text">{m.deaths}</td>
                            <td className="px-3 py-1.5 text-xs font-mono text-pc-text">{m.assists}</td>
                            <td className="px-3 py-1.5 text-xs font-mono text-pc-text">{kda}</td>
                            <td className="px-3 py-1.5 text-xs font-mono text-pc-text-muted">{dpm}</td>
                            <td className="px-3 py-1.5">
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
        </div>

        {/* Right column: Rating + Champion Ratings (1/3) */}
        <div className="lg:col-span-1 space-y-5">
          {/* Glicko Rating */}
          <div>
            <h2 className="pc-card-title shadow-sm">Rating</h2>
            <div className="pc-card">
              {kbmRating ? (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pc-accent font-mono">{Number(kbmRating.mu).toFixed(0)}</div>
                    <div className="text-[10px] text-pc-text-muted mt-0.5">Glicko-2 Rating</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="pc-surface-light rounded p-2 border border-pc-border/50">
                      <div className="text-[10px] text-pc-text-muted">Deviation</div>
                      <div className="text-xs font-mono text-pc-text">{Number(kbmRating.phi).toFixed(0)}</div>
                    </div>
                    <div className="pc-surface-light rounded p-2 border border-pc-border/50">
                      <div className="text-[10px] text-pc-text-muted">Volatility</div>
                      <div className="text-xs font-mono text-pc-text">{Number(kbmRating.volatility).toFixed(4)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-pc-border/50">
                    <div>
                      <div className="text-[10px] text-pc-text-muted">W</div>
                      <div className="text-xs font-mono text-emerald-400">{Number(kbmRating.wins)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-pc-text-muted">L</div>
                      <div className="text-xs font-mono text-rose-400">{Number(kbmRating.losses)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-pc-text-muted">WR</div>
                      <div className="text-xs font-mono text-pc-text">
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

          {/* Champion Ratings */}
          {championRatings.length > 0 && (
            <div>
              <h2 className="pc-card-title shadow-sm">Champion Ratings</h2>
              <div className="pc-card">
                <div className="space-y-2">
                  {championRatings.slice(0, 10).map((cr) => (
                    <div key={cr.champion_id} className="flex items-center gap-2 py-1.5 border-b border-pc-border/30 last:border-0">
                      <img
                        src={getChampionIconSafe(cr.champion_name)}
                        alt={cr.champion_name}
                        className="w-6 h-6 rounded object-contain shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/champions/${championSlug(cr.champion_name)}`}
                            className="text-xs text-pc-text hover:text-pc-accent transition-colors truncate"
                          >
                            {cr.champion_name}
                          </Link>
                          <span className="text-xs font-mono text-pc-accent ml-2">{Number(cr.mu).toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-pc-text-muted">
                          <span>{cr.matches_played} games</span>
                          <span>·</span>
                          <span>
                            {cr.matches_played > 0
                              ? `${((cr.wins / cr.matches_played) * 100).toFixed(0)}% WR`
                              : "No WR"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Queue Ratings (if multiple queues) */}
          {queueRatings.length > 1 && (
            <div>
              <h2 className="pc-card-title shadow-sm">Queue Ratings</h2>
              <div className="pc-card">
                <div className="space-y-2">
                  {queueRatings.map((qr) => (
                    <div key={qr.queue_id} className="flex items-center justify-between py-1.5 border-b border-pc-border/30 last:border-0">
                      <span className="text-xs text-pc-text-muted">Queue {qr.queue_id}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-pc-accent">{Number(qr.mu).toFixed(0)}</span>
                        <span className="text-[10px] text-pc-text-muted">φ{Number(qr.phi).toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
