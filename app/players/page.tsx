"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchCheaterPlayers,
  fetchClassLeaderboard,
  fetchPerformanceLeaderboard,
  fetchPlayerSearch,
  fetchRankedLeaderboard,
  type CheaterPlayer,
  type ClassLeaderboardEntry,
  type PerformanceLeaderboardEntry,
  type PlayerSearchResult,
  type RankedPlayer,
} from "@/lib/api-client";
import ScrambleText from "@/components/ScrambleText";
import { getRankIconPath, resolveEffectiveTier } from "@/lib/tier-utils";

const CLASS_ICONS: Record<string, string> = {
  Frontline: "/images/icons/Class_Front_Line_Icon.avif",
  Damage: "/images/icons/Class_Damage_Icon.avif",
  Flank: "/images/icons/Class_Flank_Icon.avif",
  Support: "/images/icons/Class_Support_Icon.avif",
};

const STAT_LABELS: Record<string, string> = {
  gpm: "Credits / Min",
  hpm: "Healing / Min",
  dpm: "Damage / Min",
  mpm: "Mitigation / Min",
};

const ROLES = ["Frontline", "Damage", "Flank", "Support"] as const;
const PERFORMANCE_METRICS = [
  { key: "gpm", metric: "gpm" },
  { key: "hpm", metric: "hpm" },
  { key: "dpm", metric: "dpm" },
  { key: "mpm", metric: "mpm" },
] as const;

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 font-bold">{rank}</span>;
  if (rank === 2) return <span className="text-gray-300 font-bold">{rank}</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold">{rank}</span>;
  return <span className="text-pc-text-muted">{rank}</span>;
}

export default function PlayersPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [classLeaderboards, setClassLeaderboards] = useState<Record<string, ClassLeaderboardEntry[]>>({});
  const [performanceLeaderboards, setPerformanceLeaderboards] = useState<Record<string, PerformanceLeaderboardEntry[]>>({});
  const [rankedPlayers, setRankedPlayers] = useState<RankedPlayer[]>([]);
  const [accountEloPlayers, setAccountEloPlayers] = useState<ClassLeaderboardEntry[]>([]);
  const [cheaterPlayers, setCheaterPlayers] = useState<CheaterPlayer[]>([]);
  const [suspiciousPlayers, setSuspiciousPlayers] = useState<CheaterPlayer[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setOverviewLoading(true);
      const [classRows, performanceRows, ranked, accountElo, cheaters, suspicious] = await Promise.all([
        Promise.all(ROLES.map(async (role) => [role, await fetchClassLeaderboard({ role, limit: 5, queueId: 486 })] as const)),
        Promise.all(PERFORMANCE_METRICS.map(async ({ key, metric }) => [key, await fetchPerformanceLeaderboard({ metric, limit: 5, queueId: 486 })] as const)),
        fetchRankedLeaderboard({ tier: "26", top: 10 }),
        /*
         * Account ELO comes from player_queue_ratings, while the four class
         * cards above come from player_champion_ratings. The backend still
         * requires a role query parameter for this shared endpoint, but ignores
         * it in account mode so the account list stays one row per player.
         */
        fetchClassLeaderboard({ role: "Frontline", limit: 10, queueId: 486, mode: "account" }),
        fetchCheaterPlayers({ cheater: true, limit: 5 }),
        fetchCheaterPlayers({ susOnly: true, limit: 5 }),
      ]);

      if (cancelled) return;
      setClassLeaderboards(Object.fromEntries(classRows));
      setPerformanceLeaderboards(Object.fromEntries(performanceRows));
      setRankedPlayers(ranked);
      setAccountEloPlayers(accountElo);
      setCheaterPlayers(cheaters);
      setSuspiciousPlayers(suspicious);
      setOverviewLoading(false);
    }

    loadOverview().catch(() => {
      if (!cancelled) setOverviewLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const search = async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    setSearchError(null);
    try {
      const data = await fetchPlayerSearch(q);
      setResults(data);
    } catch {
      setSearchError("Search unavailable");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Header + Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="pc-heading pc-heading-lg text-pc-accent">
          <ScrambleText text="Players" speed={30} iterations={15} delayFromCenter={false} />
        </h1>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
            placeholder="Search player..."
            className="pc-input pr-8 w-full text-sm"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-pc-text-muted hover:text-pc-text transition-colors"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {query.length >= 2 && (
        <div className="space-y-1">
          {searching && <p className="text-pc-text-muted text-sm">Searching...</p>}
          {searchError && <p className="text-pc-text-muted text-sm">{searchError}</p>}
          {results.map((p) => (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="flex items-center justify-between p-3 rounded-lg bg-pc-bg-elevated border border-pc-border hover:border-pc-accent-mid transition-colors"
            >
              <div>
                <span className="text-pc-text font-medium text-sm">{p.name}</span>
                <span className="text-pc-text-muted text-xs ml-2">{p.region} · {p.platform}</span>
              </div>
              {p.kbmTier && (
                <span className="text-xs px-2 py-0.5 rounded bg-pc-bg text-pc-text-secondary">{p.kbmTier}</span>
              )}
            </Link>
          ))}
          {!searching && results.length === 0 && (
            <p className="text-pc-text-muted text-sm">No players found</p>
          )}
        </div>
      )}

      {/* ── Main Content: Class LB (left) + Ranked LB (right) ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left: Class Leaderboards 2×2 + Performance Stats */}
        <div className="lg:w-3/5 space-y-4">
          <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-bold text-pc-text">Top Players by Class</h2>
            </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ROLES.map((role) => {
              const players = classLeaderboards[role] ?? [];
              return (
              <div key={role}>
                <div className="flex items-center justify-between mb-2 px-2">
                  <div className="flex items-center gap-2">
                    <img src={CLASS_ICONS[role]} alt={role} className="w-5 h-5" />
                    <h3 className="text-pc-text font-semibold text-sm">{role}</h3>
                  </div>
                  <Link href={`/players/class/${role}`} className="text-[10px] text-pc-text-secondary hover:text-pc-accent transition-colors drop-shadow-sm">
                    Detail →
                  </Link>
                </div>
                <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 hover:border-pc-accent-mid transition-colors">
                  <div className="space-y-2">
                  {players.length === 0 && (
                    <div className="text-xs text-pc-text-muted">{overviewLoading ? "Loading..." : "No ranked data"}</div>
                  )}
                  {players.map((p, i) => (
                    <div key={`${role}-${p.playerId}`} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <RankBadge rank={i + 1} />
                        <Link href={`/players/${p.playerId}`} className="text-pc-text truncate hover:text-pc-accent transition-colors">{p.playerName}</Link>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-pc-text-muted">{p.championName}</span>
                        <span className="text-emerald-400 font-medium">{p.winRate != null ? `${p.winRate.toFixed(1)}%` : "--"}</span>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            )})}
          </div>

          {/* Performance Stats 2×2 */}
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-lg font-bold text-pc-text">Performance Stats</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PERFORMANCE_METRICS.map(({ key: stat }) => {
              const players = performanceLeaderboards[stat] ?? [];
              return (
              <div key={stat}>
                <div className="flex items-center justify-between mb-2 px-2">
                  <h3 className="text-pc-text font-semibold text-sm">{STAT_LABELS[stat] || stat}</h3>
                  <Link href={`/players/stats/${stat}`} className="text-[10px] text-pc-text-secondary hover:text-pc-accent transition-colors drop-shadow-sm">
                    Detail →
                  </Link>
                </div>
                <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 hover:border-pc-accent-mid transition-colors">
                  <div className="space-y-2">
                    {players.length === 0 && (
                      <div className="text-xs text-pc-text-muted">{overviewLoading ? "Loading..." : "No ranked data"}</div>
                    )}
                    {players.map((p, i) => (
                      <div key={`${stat}-${p.playerId}`} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <RankBadge rank={i + 1} />
                          <Link href={`/players/${p.playerId}`} className="text-pc-text truncate hover:text-pc-accent transition-colors">{p.playerName}</Link>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-pc-text-muted">{p.championName ?? p.className ?? ""}</span>
                          <span className="text-pc-accent font-medium">{p.value.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Right: compact official ranked list + account-level ELO list */}
        <div className="lg:w-2/5 space-y-4">
          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-bold text-pc-text">Ranked Leaderboard</h2>
              <Link href="/players/leaderboard" className="text-[10px] text-pc-text-secondary hover:text-pc-accent transition-colors drop-shadow-sm">
                Detail →
              </Link>
            </div>
            <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
              {/* Both overview leaderboards fetch 10 rows, so avoid an inner
                  vertical scroller here. Let the cards grow downward and keep
                  every row visible in the normal page flow. */}
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-pc-border">
                      <th className="text-left text-pc-text-muted font-medium py-2 px-3 w-8 text-xs">#</th>
                      <th className="text-center text-pc-text-muted font-medium py-2 px-2 text-xs w-10">Rank</th>
                      <th className="text-left text-pc-text-muted font-medium py-2 px-2 text-xs">Player</th>
                      <th className="text-right text-pc-text-muted font-medium py-2 px-2 text-xs">+/−</th>
                      <th className="text-right text-pc-text-muted font-medium py-2 px-4 text-xs">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedPlayers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 px-3 text-center text-pc-text-muted text-xs">
                          {overviewLoading ? "Loading..." : "No ranked leaderboard data"}
                        </td>
                      </tr>
                    )}
                    {rankedPlayers.map((p, i) => {
                      const iconPath = getRankIconPath(p.tier, p.rank);
                      const effective = resolveEffectiveTier(p.tier, p.rank);
                      return (
                      <tr key={p.player_id} className={`border-b border-pc-border/50 hover:bg-pc-bg/50 transition-colors ${i < 3 ? "bg-pc-bg/30" : ""}`}>
                        <td className="py-1.5 px-3">
                          {i === 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-[11px]">🥇</span>
                          ) : i === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-400/20 text-gray-300 font-bold text-[11px]">🥈</span>
                          ) : i === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600/20 text-amber-600 font-bold text-[11px]">🥉</span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 text-pc-text-muted text-[11px]">{p.rank}</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <img
                            src={iconPath}
                            alt={effective.displayName}
                            className="w-6 h-6 object-contain inline-block"
                            title={effective.displayName}
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <Link href={`/players/${p.player_id}`} className="text-pc-text font-medium text-xs hover:text-pc-accent transition-colors">
                            {p.name}
                          </Link>
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          {p.trend != null && p.trend !== 0 ? (
                            <span className={`text-[11px] ${p.trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {p.trend > 0 ? "▲" : "▼"}{Math.abs(p.trend)}
                            </span>
                          ) : (
                            <span className="text-pc-text-muted text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-1.5 px-4 text-right text-pc-text font-medium text-xs">{p.points.toLocaleString()}</td>
                      </tr>
                    )}
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-bold text-pc-text">Account ELO</h2>
              <Link href="/players/elo" className="text-[10px] text-pc-text-secondary hover:text-pc-accent transition-colors drop-shadow-sm">
                Detail →
              </Link>
            </div>
            <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
              {/* Account ELO mirrors the ranked card: 10 fetched rows, no
                  vertical clamp, and only horizontal overflow protection. */}
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-pc-border">
                      <th className="text-left text-pc-text-muted font-medium py-2 px-3 w-8 text-xs">#</th>
                      <th className="text-left text-pc-text-muted font-medium py-2 px-2 text-xs">Player</th>
                      <th className="text-right text-pc-text-muted font-medium py-2 px-2 text-xs">ELO</th>
                      <th className="text-right text-pc-text-muted font-medium py-2 px-2 text-xs">Matches</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountEloPlayers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 px-3 text-center text-pc-text-muted text-xs">
                          {overviewLoading ? "Loading..." : "No account ELO data"}
                        </td>
                      </tr>
                    )}
                    {accountEloPlayers.map((p, i) => (
                      <tr key={`account-elo-${p.playerId}`} className={`border-b border-pc-border/50 hover:bg-pc-bg/50 transition-colors ${i < 3 ? "bg-pc-bg/30" : ""}`}>
                        <td className="py-1.5 px-3">
                          <RankBadge rank={p.rank} />
                        </td>
                        <td className="py-1.5 px-2">
                          <Link href={`/players/${p.playerId}`} className="text-pc-text font-medium text-xs hover:text-pc-accent transition-colors">
                            {p.playerName}
                          </Link>
                        </td>
                        <td className="py-1.5 px-2 text-right text-pc-accent font-medium text-xs">
                          {p.elo.toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-right text-pc-text-muted text-xs">
                          {p.totalMatches.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

      </div>

      {/* ── Cheaters & Suspicious Players ── */}
      <section>
        <h2 className="text-lg font-bold text-pc-text mb-4">Cheaters & Suspicious</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Confirmed Cheaters */}
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <h3 className="text-pc-text font-semibold text-sm">Confirmed Cheaters</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  {cheaterPlayers.length}
                </span>
              </div>
              <Link href="/players/cheaters" className="text-[10px] text-pc-text-secondary hover:text-red-400 transition-colors drop-shadow-sm">
                Detail →
              </Link>
            </div>
            <div className="bg-pc-bg-elevated border border-red-500/20 rounded-xl p-4">
              <div className="space-y-2">
              {cheaterPlayers.length === 0 && (
                <div className="text-xs text-pc-text-muted">{overviewLoading ? "Loading..." : "No confirmed cheaters"}</div>
              )}
              {cheaterPlayers.map((p) => (
                <div key={p.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-pc-bg/50">
                  <div className="shrink-0 mt-1 w-2 h-2 rounded-full bg-red-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/players/${p.id}`} className="text-pc-text font-medium text-sm hover:text-pc-accent transition-colors truncate">
                        {p.name}
                      </Link>
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border bg-red-500/15 text-red-400 border-red-500/30">
                        banned
                      </span>
                    </div>
                    <p className="text-pc-text-muted text-xs mt-0.5">
                      {p.totalMatches.toLocaleString()} matches{p.winRate != null ? ` · ${p.winRate.toFixed(1)}% WR` : ""}
                    </p>
                    <p className="text-pc-text-muted/50 text-[10px] mt-0.5">Suspicion count {p.susCount}</p>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* Suspicious Players */}
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="text-pc-text font-semibold text-sm">Suspicious Players</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {suspiciousPlayers.length}
                </span>
              </div>
              <Link href="/players/suspicious" className="text-[10px] text-pc-text-secondary hover:text-amber-400 transition-colors drop-shadow-sm">
                Detail →
              </Link>
            </div>
            <div className="bg-pc-bg-elevated border border-amber-500/20 rounded-xl p-4">
              <div className="space-y-2">
              {suspiciousPlayers.length === 0 && (
                <div className="text-xs text-pc-text-muted">{overviewLoading ? "Loading..." : "No suspicious players"}</div>
              )}
              {suspiciousPlayers.map((p) => (
                <div key={p.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-pc-bg/50">
                  <div className="shrink-0 mt-1 w-2 h-2 rounded-full bg-amber-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/players/${p.id}`} className="text-pc-text font-medium text-sm hover:text-pc-accent transition-colors truncate">
                        {p.name}
                      </Link>
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border bg-amber-500/15 text-amber-400 border-amber-500/30">
                        {p.susCount} flags
                      </span>
                    </div>
                    <p className="text-pc-text-muted text-xs mt-0.5">
                      {p.totalMatches.toLocaleString()} matches{p.winRate != null ? ` · ${p.winRate.toFixed(1)}% WR` : ""}
                    </p>
                    <p className="text-pc-text-muted/50 text-[10px] mt-0.5">{p.region} · {p.platform}</p>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
