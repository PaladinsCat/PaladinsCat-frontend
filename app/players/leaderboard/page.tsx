"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchRankedLeaderboard, type RankedPlayer } from "@/lib/api-client";
import { resolveEffectiveTier, getRankIconPath } from "@/lib/tier-utils";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";

const TIER_GROUPS: ReadonlyArray<{
  group: string;
  groupKey: TranslationKey;
  tiers: ReadonlyArray<{ tier: number; labelKey: TranslationKey }>;
}> = [
  { group: "Diamond", groupKey: "common.tiers.diamond", tiers: [
    { tier: 25, labelKey: "common.tiers.diamond1" },
    { tier: 24, labelKey: "common.tiers.diamond2" },
    { tier: 23, labelKey: "common.tiers.diamond3" },
    { tier: 22, labelKey: "common.tiers.diamond4" },
    { tier: 21, labelKey: "common.tiers.diamond5" },
  ]},
];

type SortKey = "points" | "winRate" | "totalWins" | "trend";

const SORT_OPTIONS: Array<{ key: SortKey; labelKey: TranslationKey }> = [
  { key: "points", labelKey: "common.sort.points" },
  { key: "winRate", labelKey: "common.sort.winRate" },
  { key: "totalWins", labelKey: "common.sort.totalWins" },
  { key: "trend", labelKey: "common.sort.trend" },
];

const MOBILE_TIER_OPTIONS: Array<{ value: string; labelKey: TranslationKey }> = [
  { value: "26-gm", labelKey: "common.tiers.grandmaster" },
  { value: "26-master", labelKey: "common.tiers.master" },
  ...TIER_GROUPS.flatMap((group) => group.tiers.map((item) => ({
    value: String(item.tier),
    labelKey: item.labelKey,
  }))),
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-sm">🥇</span>;
  if (rank === 2)
    return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-400/20 text-gray-300 font-bold text-sm">🥈</span>;
  if (rank === 3)
    return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600/20 text-amber-600 font-bold text-sm">🥉</span>;
  return <span className="inline-flex items-center justify-center w-7 h-7 text-pc-text-muted text-sm">{rank}</span>;
}

export default function LeaderboardPage() {
  const { t , formatNumber, formatPercent} = useLocalization();
  const [tier, setTier] = useState(26);
  const [masterSubTab, setMasterSubTab] = useState<"gm" | "master">("gm");
  const [players, setPlayers] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("points");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Diamond"]));

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // GM fetches top 100; Master fetches more so we have enough after filtering
        const top = tier === 26 && masterSubTab === "master" ? 500 : 100;
        const data = await fetchRankedLeaderboard({ tier: String(tier), top });
        if (cancelled) return;
        setPlayers(data);
      } catch {
        if (!cancelled) setError(t("generated.players.failedToLoadLeaderboardData"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tier, masterSubTab]);

  // Filter by GM/Master sub-tab, then search, then sort
  const filtered = players.filter((p) => {
    if (tier === 26 && masterSubTab === "gm") return p.rank <= 100;
    if (tier === 26 && masterSubTab === "master") return p.rank > 100;
    return true;
  }).filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    const getVal = (p: RankedPlayer, key: SortKey) => {
      switch (key) {
        case "points": return p.points;
        case "winRate": return p.winRate ?? 0;
        case "totalWins": return p.wins ?? 0;
        case "trend": return p.trend ?? 0;
        default: return 0;
      }
    };
    const av = getVal(a, sortKey);
    const bv = getVal(b, sortKey);
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const currentTierLabel = tier === 26
    ? t(masterSubTab === "gm" ? "common.tiers.grandmaster" : "common.tiers.master")
    : t(TIER_GROUPS.flatMap((group) => group.tiers).find((item) => item.tier === tier)?.labelKey ?? "common.tiers.tierNumber", { number: tier });

  const mobileTierValue = tier === 26 ? `26-${masterSubTab}` : String(tier);
  const selectMobileTier = (value: string) => {
    if (value === "26-gm" || value === "26-master") {
      setTier(26);
      setMasterSubTab(value === "26-gm" ? "gm" : "master");
      return;
    }
    setTier(Number(value));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="min-w-0">
        <Link href="/players" className="text-pc-accent text-xs hover:underline mb-2 inline-block">{t("generated.players.players")}</Link>
        <h1 className="pc-heading pc-heading-lg break-words text-pc-accent">{t("generated.players.rankedLeaderboard")}</h1>
      </div>

      {/* Main layout: sidebar + content */}
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-6">

        <section className="pc-mobile-panel space-y-3 p-3 lg:hidden" aria-label={t("generated.players.leaderboardFilters")}>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
            <label className="block min-w-0">
              <span className="pc-label">{t("generated.players.tier")}</span>
              <select
                value={mobileTierValue}
                onChange={(event) => selectMobileTier(event.target.value)}
                className="pc-select w-full"
              >
                {MOBILE_TIER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{t(option.labelKey)}</option>)}
              </select>
            </label>
            <label className="block min-w-0">
              <span className="pc-label">{t("generated.players.sort")}</span>
              <div className="flex gap-2">
                <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="pc-select min-w-0 flex-1">
                  {SORT_OPTIONS.map((option) => <option key={option.key} value={option.key}>{t(option.labelKey)}</option>)}
                </select>
                <button type="button" onClick={() => setSortDir((direction) => direction === "asc" ? "desc" : "asc")} className="pc-touch-target rounded-lg border border-pc-border bg-pc-bg px-3 text-pc-accent" aria-label={t("generated.players.sortValue1", { value1: sortDir === "asc" ? t("generated.players.descending") : t("generated.players.ascending") })}>
                  {sortDir === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </label>
          </div>
          <label className="block">
            <span className="pc-label">{t("generated.players.findAPlayer")}</span>
            <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t("generated.players.filterPlayers")} className="pc-input" />
          </label>
          <div className="flex items-center justify-between gap-3 border-t border-pc-border/70 pt-3 text-xs">
            <span className="font-semibold text-pc-text">{currentTierLabel}</span>
            <span className="text-pc-text-muted">{t(sorted.length === 1 ? "common.count.playerOne" : "common.count.playerMany", { count: sorted.length })}</span>
          </div>
        </section>

        {/* ── Left Sidebar ── */}
        <aside className="hidden w-56 shrink-0 space-y-4 lg:block">
          {/* Tier selector */}
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-3">
            <h3 className="text-pc-text-muted text-xs uppercase tracking-wider mb-2 px-1">{t("generated.players.tier")}</h3>
            <div className="space-y-0.5">
              {/* Grandmaster */}
              <button
                onClick={() => { setTier(26); setMasterSubTab("gm"); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tier === 26 && masterSubTab === "gm"
                    ? "bg-pc-accent/20 text-pc-accent border border-pc-accent/30"
                    : "text-pc-text-secondary hover:text-pc-text hover:bg-pc-bg/50"
                }`}
              >
                {t("generated.players.grandmaster")}</button>

              {/* Master */}
              <button
                onClick={() => { setTier(26); setMasterSubTab("master"); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tier === 26 && masterSubTab === "master"
                    ? "bg-pc-accent/20 text-pc-accent border border-pc-accent/30"
                    : "text-pc-text-secondary hover:text-pc-text hover:bg-pc-bg/50"
                }`}
              >
                {t("generated.players.master")}</button>

              {/* Multi-tier groups */}
              {TIER_GROUPS.map((group) => {
                const isExpanded = expandedGroups.has(group.group);
                const isActive = group.tiers.some((t) => t.tier === tier);

                return (
                  <div key={group.group}>
                    <button
                      onClick={() => toggleGroup(group.group)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? "text-pc-accent"
                          : "text-pc-text-secondary hover:text-pc-text hover:bg-pc-bg/50"
                      }`}
                    >
                      <span>{t(group.groupKey)}</span>
                      <span className="text-xs text-pc-text-muted">{isExpanded ? "▾" : "▸"}</span>
                    </button>
                    {isExpanded && (
                      <div className="ml-2 mt-0.5 space-y-0.5 border-l border-pc-border/50 pl-2">
                        {group.tiers.map((item) => (
                          <button
                            key={item.tier}
                            onClick={() => setTier(item.tier)}
                            className={`w-full text-left px-2.5 py-1 rounded-lg text-xs transition-colors ${
                              tier === item.tier
                                ? "bg-pc-accent/20 text-pc-accent font-medium border border-pc-accent/30"
                                : "text-pc-text-muted hover:text-pc-text hover:bg-pc-bg/50"
                            }`}
                          >
                            {t(item.labelKey)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sort controls */}
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-3">
            <h3 className="text-pc-text-muted text-xs uppercase tracking-wider mb-2 px-1">{t("generated.players.sortBy")}</h3>
            <div className="space-y-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    if (sortKey === opt.key) {
                      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                    } else {
                      setSortKey(opt.key);
                      setSortDir("desc");
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    sortKey === opt.key
                      ? "bg-pc-accent/20 text-pc-accent font-medium border border-pc-accent/30"
                      : "text-pc-text-secondary hover:text-pc-text hover:bg-pc-bg/50"
                  }`}
                >
                  <span>{t(opt.labelKey)}</span>
                  {sortKey === opt.key && (
                    <span className="text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Player search */}
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-3">
            <h3 className="text-pc-text-muted text-xs uppercase tracking-wider mb-2 px-1">{t("generated.players.search")}</h3>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("generated.players.filterPlayers.2950f2e")}
                className="w-full px-3 py-1.5 rounded-lg bg-pc-bg border border-pc-border text-pc-text text-xs focus:outline-none focus:border-pc-accent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-pc-text-muted hover:text-pc-text text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Current selection summary */}
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-3">
            <div className="text-pc-text-muted text-xs uppercase tracking-wider mb-1">{t("generated.players.viewing")}</div>
            <div className="text-pc-text font-semibold text-sm">{currentTierLabel}</div>
            <div className="text-pc-text-secondary text-xs mt-0.5">
              {t(sorted.length === 1 ? "common.count.playerOne" : "common.count.playerMany", { count: sorted.length })}
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="min-w-0">
          {/* Loading */}
          {loading && (
            <LoadingPanel compact />
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-pc-bg-elevated border border-pc-border rounded-xl text-center py-12">
              <p className="text-pc-text-muted">{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && sorted.length === 0 && (
            <div className="bg-pc-bg-elevated border border-pc-border rounded-xl text-center py-12">
              <p className="text-pc-text-muted">
                {searchQuery ? t("generated.players.noPlayersMatchingValue1", { value1: searchQuery }) : t("generated.players.noRankedPlayersFoundForThisTier")}
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && sorted.length > 0 && (
            <div className="space-y-2 md:hidden">
              {sorted.map((player, index) => {
                const effective = resolveEffectiveTier(player.tier, player.rank);
                return (
                  <Link key={player.player_id} href={`/players/${player.player_id}`} className="pc-mobile-panel flex min-w-0 items-center gap-3 p-3 transition-colors hover:border-pc-accent-mid">
                    <RankBadge rank={effective.displayRank} />
                    <img src={getRankIconPath(player.tier, player.rank)} alt={effective.displayName} className="h-8 w-8 shrink-0 object-contain" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-pc-text"><PlayerName playerId={player.player_id}>{player.name}</PlayerName></div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-pc-text-muted">
                        <span>{effective.displayName}</span>
                        {player.winRate != null && <span className={player.winRate >= 50 ? "text-emerald-400" : "text-red-400"}>{formatNumber(player.winRate, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{t("generated.players.wr")}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-sm font-bold text-pc-accent">{formatNumber(player.points)}</div>
                      <div className="text-[10px] uppercase tracking-wide text-pc-text-muted">{t("generated.players.points")}</div>
                      {player.trend != null && player.trend !== 0 && <div className={`mt-0.5 text-[10px] ${player.trend > 0 ? "text-emerald-400" : "text-red-400"}`}>{player.trend > 0 ? "▲" : "▼"}{Math.abs(player.trend)}</div>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!loading && !error && sorted.length > 0 && (
            <div className="hidden overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-pc-border">
                      <th className="text-left text-pc-text-muted font-medium py-3 px-4 w-28">{t("generated.players.rank")}</th>
                      <th className="text-left text-pc-text-muted font-medium py-3 px-4">{t("generated.players.player")}</th>
                      <th className="text-right text-pc-text-muted font-medium py-3 px-4">{t("generated.players.points.4b2a6a3")}</th>
                      <th className="text-right text-pc-text-muted font-medium py-3 px-4 w-16">{t("generated.players.trend")}</th>
                      <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden lg:table-cell">{t("generated.players.wins")}</th>
                      <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">{t("generated.players.winRate")}</th>
                      <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden lg:table-cell">{t("generated.players.leaves")}</th>
                      <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden lg:table-cell">{t("generated.players.leaveRate")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((p, i) => {
                      const rowBg = i < 3 ? "bg-pc-bg/30" : "";
                      const effective = resolveEffectiveTier(p.tier, p.rank);
                      const winRate = p.winRate;
                      const wins = p.wins;
                      const leaves = p.leaves;
                      const leaveRate = p.leaveRate;

                      return (
                        <tr key={p.player_id} className={`border-b border-pc-border/50 hover:bg-pc-bg/60 transition-colors ${rowBg}`}>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-3">
                              <RankBadge rank={effective.displayRank} />
                              <img src={getRankIconPath(p.tier, p.rank)} alt={effective.displayName} className="w-5 h-5 object-contain shrink-0" />
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <Link href={`/players/${p.player_id}`} className="text-pc-text font-medium hover:text-pc-accent transition-colors">
                              <PlayerName playerId={p.player_id}>{p.name}</PlayerName>
                            </Link>
                          </td>
                          <td className="py-2.5 px-4 text-right text-pc-text font-medium">{formatNumber(p.points)}</td>
                          <td className="py-2.5 px-4 text-right">
                            {p.trend != null && p.trend !== 0 ? (
                              <span className={`text-xs ${p.trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {p.trend > 0 ? "▲" : "▼"}{Math.abs(p.trend)}
                              </span>
                            ) : (
                              <span className="text-pc-text-muted text-xs">—</span>
                            )}
                            </td>
                            <td className="py-2.5 px-4 text-right text-pc-text-secondary text-xs hidden lg:table-cell">
                            {wins != null ? formatNumber(wins) : "—"}
                            </td>
                            <td className="py-2.5 px-4 text-right text-xs hidden md:table-cell">
                            {winRate != null ? (
                              <span className={winRate >= 50 ? "text-emerald-400 font-medium" : "text-red-400"}>
                                {formatPercent(winRate)}
                              </span>
                            ) : (
                              <span className="text-pc-text-muted">—</span>
                            )}
                            </td>
                            <td className="py-2.5 px-4 text-right text-xs hidden lg:table-cell">
                            {leaves != null ? (
                              <span className={leaves > 10 ? "text-red-400" : "text-pc-text-secondary"}>
                                {leaves}
                              </span>
                            ) : (
                              <span className="text-pc-text-muted">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right text-xs hidden lg:table-cell">
                            {leaveRate != null ? (
                              <span className={leaveRate > 5 ? "text-red-400" : leaveRate > 2 ? "text-yellow-400" : "text-pc-text-secondary"}>
                                {formatPercent(leaveRate)}
                              </span>
                            ) : (
                              <span className="text-pc-text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          {!loading && sorted.length > 0 && (
            <p className="text-pc-text-muted text-xs text-center mt-4">
              {t("generated.players.showing")}{" "}{sorted.length} {t("generated.players.of")}{" "}{filtered.length} {t("generated.players.playersIn")}{" "}{currentTierLabel}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
