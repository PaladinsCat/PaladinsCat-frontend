"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchPlayerSearch, type PlayerSearchResult } from "@/lib/api-client";
import ScrambleText from "@/components/ScrambleText";
import {
  MOCK_RANKED_PLAYERS,
  MOCK_CLASS_LEADERBOARDS,
  MOCK_STAT_LEADERBOARDS,
  MOCK_CONFIRMED_CHEATERS,
  MOCK_SUSPICIOUS_PLAYERS,
  TIER_NAMES,
} from "@/lib/mock-data";

const CLASS_ICONS: Record<string, string> = {
  Frontline: "/images/icons/Class_Front_Line_Icon.avif",
  Damage: "/images/icons/Class_Damage_Icon.avif",
  Flank: "/images/icons/Class_Flank_Icon.avif",
  Support: "/images/icons/Class_Support_Icon.avif",
};

const STAT_LABELS: Record<string, string> = {
  GPM: "Gold / Min",
  HPM: "Healing / Min",
  DPM: "Damage / Min",
  Tanker: "Mitigation / Min",
};

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-pc-text">Top Players by Class</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(MOCK_CLASS_LEADERBOARDS).map(([role, players]) => (
              <div key={role} className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 hover:border-pc-accent-mid transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img src={CLASS_ICONS[role]} alt={role} className="w-5 h-5" />
                    <h3 className="text-pc-text font-semibold text-sm">{role}</h3>
                  </div>
                  <Link href={`/players/class/${role}`} className="text-[10px] px-1.5 py-0.5 rounded bg-pc-bg text-pc-accent hover:bg-pc-accent hover:text-pc-bg transition-colors">
                    Detail →
                  </Link>
                </div>
                <div className="space-y-2">
                  {players.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <RankBadge rank={i + 1} />
                        <span className="text-pc-text truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-pc-text-muted">{p.champion}</span>
                        <span className="text-emerald-400 font-medium">{p.winRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Performance Stats 2×2 */}
          <h2 className="text-lg font-bold text-pc-text">Performance Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(MOCK_STAT_LEADERBOARDS).map(([stat, players]) => (
              <div key={stat} className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 hover:border-pc-accent-mid transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-pc-text font-semibold text-sm">{STAT_LABELS[stat] || stat}</h3>
                  <Link href={`/players/stats/${stat}`} className="text-[10px] px-1.5 py-0.5 rounded bg-pc-bg text-pc-accent hover:bg-pc-accent hover:text-pc-bg transition-colors">
                    Detail →
                  </Link>
                </div>
                <div className="space-y-2">
                  {players.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <RankBadge rank={i + 1} />
                        <span className="text-pc-text truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-pc-text-muted">{p.champion}</span>
                        <span className="text-pc-accent font-medium">{p.value.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Ranked Leaderboard */}
        <div className="lg:w-2/5 flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-pc-text">Ranked Leaderboard</h2>
            <Link href="/players/leaderboard" className="ml-auto text-[10px] px-2 py-0.5 rounded bg-pc-bg text-pc-accent hover:bg-pc-accent hover:text-pc-bg transition-colors">
              Detail →
            </Link>
          </div>
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-y-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pc-border">
                  <th className="text-left text-pc-text-muted font-medium py-2.5 px-3 w-10">#</th>
                  <th className="text-left text-pc-text-muted font-medium py-2.5 px-3">Player</th>
                  <th className="text-left text-pc-text-muted font-medium py-2.5 px-3 hidden sm:table-cell">Tier</th>
                  <th className="text-right text-pc-text-muted font-medium py-2.5 px-3">Pts</th>
                  <th className="text-right text-pc-text-muted font-medium py-2.5 px-3 w-12">+/−</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RANKED_PLAYERS.map((p, i) => (
                  <tr key={p.player_id} className={`border-b border-pc-border/50 hover:bg-pc-bg/50 transition-colors ${i < 3 ? "bg-pc-bg/30" : ""}`}>
                    <td className="py-2 px-3"><RankBadge rank={p.rank} /></td>
                    <td className="py-2 px-3">
                      <Link href={`/players/${p.player_id}`} className="text-pc-text font-medium text-xs hover:text-pc-accent transition-colors">
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-2 px-3 text-pc-text-secondary text-xs hidden sm:table-cell">
                      {TIER_NAMES[p.tier] || `Tier ${p.tier}`}
                    </td>
                    <td className="py-2 px-3 text-right text-pc-text font-medium text-xs">{p.points.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">
                      {p.trend != null && p.trend !== 0 ? (
                        <span className={`text-xs ${p.trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {p.trend > 0 ? "▲" : "▼"}{Math.abs(p.trend)}
                        </span>
                      ) : (
                        <span className="text-pc-text-muted text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── Cheaters & Suspicious Players ── */}
      <section>
        <h2 className="text-lg font-bold text-pc-text mb-4">Cheaters & Suspicious</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Confirmed Cheaters */}
          <div className="bg-pc-bg-elevated border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <h3 className="text-pc-text font-semibold text-sm">Confirmed Cheaters</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  {MOCK_CONFIRMED_CHEATERS.length}
                </span>
              </div>
              <Link href="/players/cheaters" className="text-[10px] px-2 py-0.5 rounded bg-pc-bg text-red-400 hover:bg-red-500 hover:text-pc-bg transition-colors">
                Detail →
              </Link>
            </div>
            <div className="space-y-2">
              {MOCK_CONFIRMED_CHEATERS.map((p) => (
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
                    <p className="text-pc-text-muted text-xs mt-0.5">{p.reason}</p>
                    <p className="text-pc-text-muted/50 text-[10px] mt-0.5">Banned {p.banned}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suspicious Players */}
          <div className="bg-pc-bg-elevated border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="text-pc-text font-semibold text-sm">Suspicious Players</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {MOCK_SUSPICIOUS_PLAYERS.length}
                </span>
              </div>
              <Link href="/players/suspicious" className="text-[10px] px-2 py-0.5 rounded bg-pc-bg text-amber-400 hover:bg-amber-500 hover:text-pc-bg transition-colors">
                Detail →
              </Link>
            </div>
            <div className="space-y-2">
              {MOCK_SUSPICIOUS_PLAYERS.map((p) => (
                <div key={p.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-pc-bg/50">
                  <div className={`shrink-0 mt-1 w-2 h-2 rounded-full ${p.severity === "medium" ? "bg-amber-500" : "bg-yellow-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/players/${p.id}`} className="text-pc-text font-medium text-sm hover:text-pc-accent transition-colors truncate">
                        {p.name}
                      </Link>
                      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border ${SEVERITY_STYLES[p.severity]}`}>
                        {p.severity}
                      </span>
                    </div>
                    <p className="text-pc-text-muted text-xs mt-0.5">{p.reason}</p>
                    <p className="text-pc-text-muted/50 text-[10px] mt-0.5">Flagged {p.flagged}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
