"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchPlayerSearch,
  fetchPlayersOverview,
  type CheaterPlayer,
  type ClassLeaderboardEntry,
  type PerformanceLeaderboardEntry,
  type PlayerSearchResult,
  type PrivateAccountSummary,
  type RankedPlayer,
  type PartyPairSummary,
  type ChampionEloEntry,
  type PlayersOverview,
} from "@/lib/api-client";
import ScrambleText from "@/components/ScrambleText";
import { getRankIconPath, resolveEffectiveTier } from "@/lib/tier-utils";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { LoadingIndicator, LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";

const STAT_LABELS: Record<string, string> = {
  gpm: "Credits / Min",
  hpm: "Healing / Min",
  dpm: "Damage / Min",
  mpm: "Shielding / Min",
};

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

function InlineLoading() {
  return <LoadingIndicator className="gap-1.5 text-xs" />;
}

export default function PlayersPageClient({ initialOverview }: { initialOverview: PlayersOverview | null }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [championEloPlayers, setChampionEloPlayers] = useState<ChampionEloEntry[]>(initialOverview?.championEloPlayers ?? []);
  const [performanceLeaderboards, setPerformanceLeaderboards] = useState<Record<string, PerformanceLeaderboardEntry[]>>(initialOverview?.performanceLeaderboards ?? {});
  const [rankedPlayers, setRankedPlayers] = useState<RankedPlayer[]>(initialOverview?.rankedPlayers ?? []);
  const [accountEloPlayers, setAccountEloPlayers] = useState<ClassLeaderboardEntry[]>(initialOverview?.accountEloPlayers ?? []);
  const [communityCounts, setCommunityCounts] = useState<PlayersOverview["communityCounts"]>(initialOverview?.communityCounts ?? {
    cheaters: initialOverview?.cheaterPlayers.length ?? 0,
    suspicious: initialOverview?.suspiciousPlayers.length ?? 0,
    weirdos: initialOverview?.weirdoPlayers.length ?? 0,
    hallOfFame: initialOverview?.hallOfFamePlayers.length ?? 0,
  });
  const [cheaterPlayers, setCheaterPlayers] = useState<CheaterPlayer[]>(initialOverview?.cheaterPlayers ?? []);
  const [suspiciousPlayers, setSuspiciousPlayers] = useState<CheaterPlayer[]>(initialOverview?.suspiciousPlayers ?? []);
  const [weirdoPlayers, setWeirdoPlayers] = useState<CheaterPlayer[]>(initialOverview?.weirdoPlayers ?? []);
  const [hallOfFamePlayers, setHallOfFamePlayers] = useState<CheaterPlayer[]>(initialOverview?.hallOfFamePlayers ?? []);
  const [privateAccounts, setPrivateAccounts] = useState<PrivateAccountSummary[]>(initialOverview?.privateAccounts ?? []);
  const [partyPairs, setPartyPairs] = useState<PartyPairSummary[]>(initialOverview?.partyPairs ?? []);
  const [directoryCounts, setDirectoryCounts] = useState<PlayersOverview["directoryCounts"]>(initialOverview?.directoryCounts ?? {
    privateAccounts: initialOverview?.privateAccounts.length ?? 0,
    parties: initialOverview?.partyPairs.length ?? 0,
  });
  const [overviewLoading, setOverviewLoading] = useState(initialOverview == null);

  useEffect(() => {
    // The normal path is server-rendered from the shared Next cache. Keep a
    // browser fallback so a transient backend failure during SSR does not turn
    // the whole directory into an error page.
    if (initialOverview) return;

    let cancelled = false;
    setOverviewLoading(true);
    fetchPlayersOverview()
      .then((overview) => {
        if (cancelled) return;
        setChampionEloPlayers(overview.championEloPlayers);
        setPerformanceLeaderboards(overview.performanceLeaderboards);
        setRankedPlayers(overview.rankedPlayers);
        setAccountEloPlayers(overview.accountEloPlayers);
        setCommunityCounts(overview.communityCounts);
        setCheaterPlayers(overview.cheaterPlayers);
        setSuspiciousPlayers(overview.suspiciousPlayers);
        setWeirdoPlayers(overview.weirdoPlayers);
        setHallOfFamePlayers(overview.hallOfFamePlayers);
        setPrivateAccounts(overview.privateAccounts);
        setPartyPairs(overview.partyPairs);
        setDirectoryCounts(overview.directoryCounts);
      })
      .catch(() => {
        // The empty-state copy remains visible; avoid an unhandled rejection
        // if both the server render and browser fallback lose the backend.
      })
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialOverview]);

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
          {searching && <LoadingPanel compact />}
          {searchError && <p className="text-pc-text-muted text-sm">{searchError}</p>}
          {results.map((p) => (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              className="flex items-center justify-between p-3 rounded-lg bg-pc-bg-elevated border border-pc-border hover:border-pc-accent-mid transition-colors"
            >
              <div>
                <PlayerName playerId={p.id}>{p.name}</PlayerName>
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

      {/* ── Main Content: Performance (left) + Leaderboards (right) ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left: Performance Stats 2×2 + Cheaters & Suspicious in one grid */}
        <div className="lg:w-3/5 space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-sm font-bold text-pc-text">Performance Stats</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
            {PERFORMANCE_METRICS.map(({ key: stat }) => {
              const players = performanceLeaderboards[stat] ?? [];
              return (
              <div key={stat} className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h3 className="text-pc-text font-semibold text-xs">{STAT_LABELS[stat] || stat}</h3>
                  <Link href={`/players/stats/${stat}`} className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors drop-shadow-sm">
                    Detail →
                  </Link>
                </div>
                <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-3 hover:border-pc-accent-mid transition-colors flex-1 flex flex-col justify-start">
                  <div className="space-y-1.5">
                    {players.length === 0 && (
                      <div className="text-xs text-pc-text-muted">{overviewLoading ? <InlineLoading /> : "No ranked data"}</div>
                    )}
                    {players.map((p, i) => (
                      <div key={`${stat}-${p.playerId}`} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <RankBadge rank={i + 1} />
                          <Link href={`/players/${p.playerId}`} className="text-pc-text truncate hover:text-pc-accent transition-colors"><PlayerName playerId={p.playerId}>{p.playerName}</PlayerName></Link>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {p.championName ? (
                            <img
                              src={getChampionIconSafe(p.championName)}
                              alt={p.championName}
                              title={p.championName}
                              className="h-4 w-4 shrink-0 rounded object-contain"
                            />
                          ) : p.className ? (
                            <span className="text-pc-text-muted">{p.className}</span>
                          ) : null}
                          <span className="text-pc-accent font-medium">{p.value.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )})}

            {/* Confirmed Cheaters */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <h3 className="text-pc-text font-semibold text-xs">Cheaters</h3>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    {communityCounts.cheaters}
                  </span>
                </div>
                <Link href="/players/cheaters" className="text-xs text-pc-text-secondary hover:text-red-400 transition-colors drop-shadow-sm">
                  Detail →
                </Link>
              </div>
              <div className="bg-pc-bg-elevated border border-red-500/20 rounded-xl p-3 flex-1 flex flex-col justify-start">
                <div className="space-y-1.5">
                {cheaterPlayers.length === 0 && (
                  <div className="text-xs text-pc-text-muted">{overviewLoading ? <InlineLoading /> : "No confirmed cheaters"}</div>
                )}
                {cheaterPlayers.map((p) => (
                  <div key={p.id} className="flex items-start gap-2 p-2 rounded-lg bg-pc-bg/50">
                    <div className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/players/${p.id}`} className="text-pc-text font-medium text-xs hover:text-pc-accent transition-colors truncate">
                        <PlayerName playerId={p.id} cheater={p.cheater} susCount={p.susCount}>{p.name}</PlayerName>
                      </Link>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </div>

            {/* Suspicious Players */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <h3 className="text-pc-text font-semibold text-xs">Suspicious</h3>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {communityCounts.suspicious}
                  </span>
                </div>
                <Link href="/players/suspicious" className="text-xs text-pc-text-secondary hover:text-amber-400 transition-colors drop-shadow-sm">
                  Detail →
                </Link>
              </div>
              <div className="bg-pc-bg-elevated border border-amber-500/20 rounded-xl p-3 flex-1 flex flex-col justify-start">
                <div className="space-y-1.5">
                {suspiciousPlayers.length === 0 && (
                  <div className="text-xs text-pc-text-muted">{overviewLoading ? <InlineLoading /> : "No suspicious players"}</div>
                )}
                {suspiciousPlayers.map((p) => (
                  <div key={p.id} className="flex items-start gap-2 p-2 rounded-lg bg-pc-bg/50">
                    <div className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <Link href={`/players/${p.id}`} className="text-pc-text font-medium text-xs hover:text-pc-accent transition-colors truncate">
                          <PlayerName playerId={p.id} cheater={p.cheater} susCount={p.susCount}>{p.name}</PlayerName>
                        </Link>
                        <span className="shrink-0 text-xs px-1 py-0.5 rounded border bg-amber-500/15 text-amber-400 border-amber-500/30">
                          {p.susCount}
                        </span>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </div>

            {/* Community Weirdo Votes */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <h3 className="text-pc-text font-semibold text-xs">Weirdo</h3>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    {communityCounts.weirdos}
                  </span>
                </div>
                <Link href="/players/weirdos" className="text-xs text-pc-text-secondary hover:text-violet-300 transition-colors drop-shadow-sm">
                  Detail →
                </Link>
              </div>
              <div className="bg-pc-bg-elevated border border-violet-500/20 rounded-xl p-3 flex-1 flex flex-col justify-start">
                <div className="space-y-1.5">
                  {weirdoPlayers.length === 0 && (
                    <div className="text-xs text-pc-text-muted">{overviewLoading ? <InlineLoading /> : "No Weirdo votes yet"}</div>
                  )}
                  {weirdoPlayers.map((p) => (
                    <div key={p.id} className="flex items-start gap-2 p-2 rounded-lg bg-pc-bg/50">
                      <div className="shrink-0 mt-0.5 text-violet-300 text-xs">✦</div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <Link href={`/players/${p.id}`} className="text-pc-text font-medium text-xs hover:text-pc-accent transition-colors truncate"><PlayerName playerId={p.id} cheater={p.cheater} susCount={p.susCount}>{p.name}</PlayerName></Link>
                        <span className="shrink-0 text-xs px-1 py-0.5 rounded border bg-violet-500/15 text-violet-300 border-violet-500/30">{p.weirdoCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Community Hall of Fame Votes */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h3 className="text-pc-text font-semibold text-xs">Hall of Fame</h3>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {communityCounts.hallOfFame}
                  </span>
                </div>
                <Link href="/players/hall-of-fame" className="text-xs text-pc-text-secondary hover:text-emerald-300 transition-colors drop-shadow-sm">
                  Detail →
                </Link>
              </div>
              <div className="bg-pc-bg-elevated border border-emerald-500/20 rounded-xl p-3 flex-1 flex flex-col justify-start">
                <div className="space-y-1.5">
                  {hallOfFamePlayers.length === 0 && (
                    <div className="text-xs text-pc-text-muted">{overviewLoading ? <InlineLoading /> : "No Hall of Fame votes yet"}</div>
                  )}
                  {hallOfFamePlayers.map((p) => (
                    <div key={p.id} className="flex items-start gap-2 p-2 rounded-lg bg-pc-bg/50">
                      <div className="shrink-0 mt-0.5 text-emerald-300 text-xs">♥</div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <Link href={`/players/${p.id}`} className="text-pc-text font-medium text-xs hover:text-pc-accent transition-colors truncate"><PlayerName playerId={p.id} cheater={p.cheater} susCount={p.susCount}>{p.name}</PlayerName></Link>
                        <span className="shrink-0 text-xs px-1 py-0.5 rounded border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">{p.hallOfFameCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tracked private accounts */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 shrink-0 rounded-full bg-slate-400" />
                  <h3 className="text-pc-text font-semibold text-xs truncate">Private Accounts</h3>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-400/10 text-slate-300 border border-slate-400/20">
                    {directoryCounts.privateAccounts}
                  </span>
                </div>
              </div>
              <div className="bg-pc-bg-elevated border border-slate-400/20 rounded-xl p-3 flex-1 flex flex-col justify-start">
                <div className="space-y-1.5">
                  {privateAccounts.length === 0 && (
                    <div className="text-xs text-pc-text-muted">{overviewLoading ? <InlineLoading /> : "No private accounts tracked"}</div>
                  )}
                  {privateAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-pc-bg/50 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 text-slate-300">◌</span>
                        <span className="text-pc-text font-medium truncate">{account.alias || `Private #${account.id}`}</span>
                      </div>
                      <span className="shrink-0 px-1 py-0.5 rounded border bg-slate-400/10 text-slate-300 border-slate-400/20" title="Recorded matches">
                        {account.matchCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ranked party pairs */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 shrink-0 rounded-full bg-cyan-500" />
                  <h3 className="text-pc-text font-semibold text-xs">Parties</h3>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {directoryCounts.parties}
                  </span>
                </div>
              </div>
              <div className="bg-pc-bg-elevated border border-cyan-500/20 rounded-xl p-3 flex-1 flex flex-col justify-start">
                <div className="space-y-1.5">
                  {partyPairs.length === 0 && (
                    <div className="text-xs text-pc-text-muted">{overviewLoading ? <InlineLoading /> : "No ranked party pairs"}</div>
                  )}
                  {partyPairs.map((pair) => (
                    <div key={`${pair.sourcePlayerId}-${pair.targetPlayerId}`} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-pc-bg/50 text-xs">
                      <div className="min-w-0 truncate text-pc-text">
                        <Link href={`/players/${pair.sourcePlayerId}`} className="font-medium hover:text-pc-accent transition-colors">{pair.sourcePlayerName}</Link>
                        <span className="px-1 text-cyan-300">+</span>
                        <Link href={`/players/${pair.targetPlayerId}`} className="font-medium hover:text-pc-accent transition-colors">{pair.targetPlayerName}</Link>
                      </div>
                      <span className="shrink-0 px-1 py-0.5 rounded border bg-cyan-500/10 text-cyan-300 border-cyan-500/20" title="Ranked matches together">
                        {pair.matchCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right: expanded ranked leaderboard on top, two cards below */}
        <div className="lg:w-2/5 space-y-4">
          {/* Ranked Leaderboard — expanded, full width */}
          <section>
            <div className="flex items-center justify-between mb-2 px-2">
              <h2 className="text-sm font-bold text-pc-text">Ranked Leaderboard</h2>
              <Link href="/players/leaderboard" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors drop-shadow-sm">
                Detail →
              </Link>
            </div>
            <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4">
              {rankedPlayers.length === 0 ? (
                <div className="text-xs text-pc-text-muted">{overviewLoading ? <InlineLoading /> : "No ranked leaderboard data"}</div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {(() => {
                    const mid = Math.ceil(rankedPlayers.length / 2);
                    const left = rankedPlayers.slice(0, mid);
                    const right = rankedPlayers.slice(mid);
                    return (
                      <>
                        {/* Left column: ranks 1..mid */}
                        <div className="space-y-1.5">
                          {left.map((p, i) => {
                            const iconPath = getRankIconPath(p.tier, p.rank);
                            const effective = resolveEffectiveTier(p.tier, p.rank);
                            return (
                              <div key={p.player_id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <RankBadge rank={i + 1} />
                                  <img src={iconPath} alt={effective.displayName} className="w-4 h-4 object-contain shrink-0" title={effective.displayName} />
                                  <Link href={`/players/${p.player_id}`} className="text-pc-text truncate hover:text-pc-accent transition-colors"><PlayerName playerId={p.player_id}>{p.name}</PlayerName></Link>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {p.trend != null && p.trend !== 0 ? (
                                    <span className={p.trend > 0 ? "text-emerald-400" : "text-red-400"}>
                                      {p.trend > 0 ? "▲" : "▼"}{Math.abs(p.trend)}
                                    </span>
                                  ) : (
                                    <span className="text-pc-text-muted">—</span>
                                  )}
                                  <span className="text-pc-text font-medium">{p.points.toLocaleString()}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Right column: ranks mid+1..end */}
                        <div className="space-y-1.5">
                          {right.map((p, i) => {
                            const iconPath = getRankIconPath(p.tier, p.rank);
                            const effective = resolveEffectiveTier(p.tier, p.rank);
                            const rank = mid + i + 1;
                            return (
                              <div key={p.player_id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <RankBadge rank={rank} />
                                  <img src={iconPath} alt={effective.displayName} className="w-4 h-4 object-contain shrink-0" title={effective.displayName} />
                                  <Link href={`/players/${p.player_id}`} className="text-pc-text truncate hover:text-pc-accent transition-colors"><PlayerName playerId={p.player_id}>{p.name}</PlayerName></Link>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {p.trend != null && p.trend !== 0 ? (
                                    <span className={p.trend > 0 ? "text-emerald-400" : "text-red-400"}>
                                      {p.trend > 0 ? "▲" : "▼"}{Math.abs(p.trend)}
                                    </span>
                                  ) : (
                                    <span className="text-pc-text-muted">—</span>
                                  )}
                                  <span className="text-pc-text font-medium">{p.points.toLocaleString()}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </section>

          {/* Two cards below */}
          <div className="grid grid-cols-2 gap-3">
            {/* Top Players by Champion */}
            <section>
              <div className="flex items-center justify-between mb-2 px-2">
                <h2 className="text-sm font-bold text-pc-text">Top Players by Champion</h2>
                <Link href="/players/elo" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors drop-shadow-sm">
                  Detail →
                </Link>
              </div>
              <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-3">
                <div className="space-y-1.5">
                  {championEloPlayers.length === 0 && (
                    <div className="text-xs text-pc-text-muted">{overviewLoading ? <InlineLoading /> : "No data"}</div>
                  )}
                  {championEloPlayers.map((p, i) => (
                    <div key={`champ-elo-${p.player_id}`} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <RankBadge rank={i + 1} />
                        <Link href={`/players/${p.player_id}`} className="text-pc-text truncate hover:text-pc-accent transition-colors"><PlayerName playerId={p.player_id}>{p.player_name}</PlayerName></Link>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <img src={getChampionIconSafe(p.champion_name)} alt="" className="w-4 h-4 object-contain rounded" />
                        <span className="text-pc-accent font-medium">{Math.round(p.elo)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Account ELO */}
            <section>
              <div className="flex items-center justify-between mb-2 px-2">
                <h2 className="text-sm font-bold text-pc-text">Account ELO</h2>
                <Link href="/players/elo?mode=account" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors drop-shadow-sm">
                  Detail →
                </Link>
              </div>
              <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-3">
                <div className="space-y-1.5">
                  {accountEloPlayers.length === 0 && (
                    <div className="text-xs text-pc-text-muted">{overviewLoading ? <InlineLoading /> : "No data"}</div>
                  )}
                  {accountEloPlayers.map((p) => (
                    <div key={`account-elo-${p.playerId}`} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <RankBadge rank={p.rank} />
                        <Link href={`/players/${p.playerId}`} className="text-pc-text truncate hover:text-pc-accent transition-colors"><PlayerName playerId={p.playerId}>{p.playerName}</PlayerName></Link>
                      </div>
                      <span className="text-pc-accent font-medium">{p.elo.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

      </div>
    </div>
  );
}
