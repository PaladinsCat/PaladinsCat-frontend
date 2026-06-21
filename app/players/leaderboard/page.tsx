"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchRankedLeaderboard, type RankedPlayer } from "@/lib/api-client";
import { resolveEffectiveTier, getRankIconPath } from "@/lib/tier-utils";

const TIER_GROUPS = [
  { group: "Diamond", tiers: [
    { tier: 25, label: "Diamond I" },
    { tier: 24, label: "Diamond II" },
    { tier: 23, label: "Diamond III" },
    { tier: 22, label: "Diamond IV" },
    { tier: 21, label: "Diamond V" },
  ]},
  { group: "Platinum", tiers: [
    { tier: 20, label: "Platinum I" },
    { tier: 19, label: "Platinum II" },
    { tier: 18, label: "Platinum III" },
    { tier: 17, label: "Platinum IV" },
    { tier: 16, label: "Platinum V" },
  ]},
  { group: "Gold", tiers: [
    { tier: 15, label: "Gold I" },
    { tier: 14, label: "Gold II" },
    { tier: 13, label: "Gold III" },
    { tier: 12, label: "Gold IV" },
    { tier: 11, label: "Gold V" },
  ]},
  { group: "Silver", tiers: [
    { tier: 10, label: "Silver I" },
    { tier: 9, label: "Silver II" },
    { tier: 8, label: "Silver III" },
    { tier: 7, label: "Silver IV" },
    { tier: 6, label: "Silver V" },
  ]},
  { group: "Bronze", tiers: [
    { tier: 5, label: "Bronze I" },
    { tier: 4, label: "Bronze II" },
    { tier: 3, label: "Bronze III" },
    { tier: 2, label: "Bronze IV" },
    { tier: 1, label: "Bronze V" },
  ]},
];

type SortKey = "points" | "winRate" | "totalWins" | "trend";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "points", label: "Points" },
  { key: "winRate", label: "Win Rate" },
  { key: "totalWins", label: "Total Wins" },
  { key: "trend", label: "Trend" },
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
        if (!cancelled) setError("Failed to load leaderboard data.");
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
    ? (masterSubTab === "gm" ? "Grandmaster" : "Master")
    : (TIER_GROUPS.flatMap((g) => g.tiers).find((t) => t.tier === tier)?.label || `Tier ${tier}`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/players" className="text-pc-accent text-xs hover:underline mb-2 inline-block">← Players</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Ranked Leaderboard</h1>
      </div>

      {/* Main layout: sidebar + content */}
      <div className="flex gap-6">

        {/* ── Left Sidebar ── */}
        <aside className="w-56 shrink-0 space-y-4">
          {/* Tier selector */}
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-3">
            <h3 className="text-pc-text-muted text-[10px] uppercase tracking-wider mb-2 px-1">Tier</h3>
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
                Grandmaster
              </button>

              {/* Master */}
              <button
                onClick={() => { setTier(26); setMasterSubTab("master"); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tier === 26 && masterSubTab === "master"
                    ? "bg-pc-accent/20 text-pc-accent border border-pc-accent/30"
                    : "text-pc-text-secondary hover:text-pc-text hover:bg-pc-bg/50"
                }`}
              >
                Master
              </button>

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
                      <span>{group.group}</span>
                      <span className="text-[10px] text-pc-text-muted">{isExpanded ? "▾" : "▸"}</span>
                    </button>
                    {isExpanded && (
                      <div className="ml-2 mt-0.5 space-y-0.5 border-l border-pc-border/50 pl-2">
                        {group.tiers.map((t) => (
                          <button
                            key={t.tier}
                            onClick={() => setTier(t.tier)}
                            className={`w-full text-left px-2.5 py-1 rounded-lg text-xs transition-colors ${
                              tier === t.tier
                                ? "bg-pc-accent/20 text-pc-accent font-medium border border-pc-accent/30"
                                : "text-pc-text-muted hover:text-pc-text hover:bg-pc-bg/50"
                            }`}
                          >
                            {t.label.replace(group.group + " ", "")}
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
            <h3 className="text-pc-text-muted text-[10px] uppercase tracking-wider mb-2 px-1">Sort By</h3>
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
                  <span>{opt.label}</span>
                  {sortKey === opt.key && (
                    <span className="text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Player search */}
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-3">
            <h3 className="text-pc-text-muted text-[10px] uppercase tracking-wider mb-2 px-1">Search</h3>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter players..."
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
            <div className="text-pc-text-muted text-[10px] uppercase tracking-wider mb-1">Viewing</div>
            <div className="text-pc-text font-semibold text-sm">{currentTierLabel}</div>
            <div className="text-pc-text-secondary text-xs mt-0.5">
              {sorted.length} player{sorted.length !== 1 ? "s" : ""}
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-pc-text-muted text-sm animate-pulse">Loading leaderboard...</div>
            </div>
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
                {searchQuery ? `No players matching "${searchQuery}".` : "No ranked players found for this tier."}
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && sorted.length > 0 && (
            <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-pc-border">
                      <th className="text-left text-pc-text-muted font-medium py-3 px-4 w-28">Rank</th>
                      <th className="text-left text-pc-text-muted font-medium py-3 px-4">Player</th>
                      <th className="text-right text-pc-text-muted font-medium py-3 px-4">Points</th>
                      <th className="text-right text-pc-text-muted font-medium py-3 px-4 w-16">Trend</th>
                      <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden lg:table-cell">Wins</th>
                      <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">Win Rate</th>
                      <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden lg:table-cell">Leaves</th>
                      <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden lg:table-cell">Leave Rate</th>
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
                              {p.name}
                            </Link>
                          </td>
                          <td className="py-2.5 px-4 text-right text-pc-text font-medium">{p.points.toLocaleString()}</td>
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
                            {wins != null ? wins.toLocaleString() : "—"}
                            </td>
                            <td className="py-2.5 px-4 text-right text-xs hidden md:table-cell">
                            {winRate != null ? (
                              <span className={winRate >= 50 ? "text-emerald-400 font-medium" : "text-red-400"}>
                                {winRate.toFixed(1)}%
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
                                {leaveRate.toFixed(1)}%
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
              Showing {sorted.length} of {filtered.length} players in {currentTierLabel}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
