"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Card from "@/components/Card";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import {
  fetchChampions,
  fetchRankedLeaderboard,
  fetchStatsChampions,
  type Champion,
  type RankedPlayer,
  type StatsChampion,
} from "@/lib/api-client";
import { MOCK_STATS_CHAMPIONS, MOCK_RANKED_PLAYERS, MOCK_CHAMPIONS } from "@/lib/mock-data";

// Champion roles for grouping
const ROLES = ["Damage", "Flank", "Frontline", "Support"];

const DUMMY_LEADERBOARD = MOCK_RANKED_PLAYERS.map((p) => ({
  rank: p.rank,
  player_id: p.player_id,
  name: p.name,
  points: p.points,
  trend: p.trend,
} as RankedPlayer));

export default function HomePage() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [statsChampions, setStatsChampions] = useState<StatsChampion[]>([]);
  const [rankedPlayers, setRankedPlayers] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [champs, stats, players] = await Promise.all([
          fetchChampions(),
          fetchStatsChampions({ sort: "win_rate", limit: 26 }),
          fetchRankedLeaderboard({ tier: "26", top: 20 }),
        ]);

        // Use API data or fall back to mock data
        setChampions(champs.length > 0 ? champs : MOCK_CHAMPIONS);
        setStatsChampions(stats.length > 0 ? stats : MOCK_STATS_CHAMPIONS);
        setRankedPlayers(players.length > 0 ? players : DUMMY_LEADERBOARD);
      } catch {
        // On error, use mock data as fallback
        setChampions(MOCK_CHAMPIONS);
        setStatsChampions(MOCK_STATS_CHAMPIONS);
        setRankedPlayers(DUMMY_LEADERBOARD);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const [searchHovered, setSearchHovered] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="relative z-10 min-h-screen py-8">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="text-center mb-12"
        >
          <Image
            src="/images/icons/paladinscat.avif"
            alt="PaladinsCat logo"
            width={80}
            height={80}
            className="mx-auto mb-2 opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
          />
          <h1 className="text-4xl font-semibold tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
            <ScrambleText
              text="PaladinsCat"
              speed={30}
              iterations={15}
              delayFromCenter={false}
            />
          </h1>
          <p className="text-xs text-pc-text-secondary mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            Paladins: Comp Analytics Tool — advanced statistic, or just meow.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-md mx-auto mb-16"
        >
          <form
            action="/search"
            method="GET"
            onMouseEnter={() => setSearchHovered(true)}
            onMouseLeave={() => setSearchHovered(false)}
            onSubmit={(e) => {
              if (searchValue.trim() === "") {
                e.preventDefault();
              }
            }}
            className={`group relative rounded-lg border transition-all duration-200 ease-out hover:scale-[1.02] hover:border-pc-accent-mid hover:bg-[#202127] hover:shadow-[0_10px_26px_rgba(51,182,177,0.14)] focus-within:scale-[1.02] focus-within:border-pc-accent-mid focus-within:bg-[#202127] focus-within:shadow-[0_10px_26px_rgba(51,182,177,0.14)] ${searchHovered || searchFocused ? "scale-[1.02] border-pc-accent-mid bg-[#202127] shadow-[0_10px_26px_rgba(51,182,177,0.14)]" : "border-white/5 bg-[#1a1d23]"}`}
            style={{ backgroundColor: searchHovered || searchFocused ? undefined : "oklch(0.210 0.005 280 / 0.75)", backdropFilter: searchHovered || searchFocused ? undefined : "blur(12px)", WebkitBackdropFilter: searchHovered || searchFocused ? undefined : "blur(12px)" }}
          >
            <input
              type="text"
              name="q"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search players, champions, matches..."
              className="w-full bg-transparent px-4 py-2 text-sm text-pc-text outline-none rounded-lg pr-16 transition-colors placeholder:text-pc-text-muted"
            />
            {searchValue.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchValue("")}
                className="absolute inset-y-0 right-10 flex items-center text-pc-text-muted hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors ${searchHovered || searchFocused ? "text-pc-accent" : "text-pc-text-muted group-hover:text-pc-accent group-focus-within:text-pc-accent"}`}><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
          </form>
        </motion.div>

        {/* Main content: two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Top Win Rate by Role */}
            <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <Card style={{ maxWidth: "none" }}>
                <div className="pc-card-title mb-4">
                  <ScrambleText text="Top Win Rate" speed={45} iterations={3} delayFromCenter={false} />
                </div>
                {loading ? (
                  <div className="space-y-4">
                    {ROLES.map((role) => (
                      <div key={role}>
                        <h3 className="text-pc-text font-medium text-sm mb-3">{role}</h3>
                        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="pc-skeleton h-16 w-full mb-3" />)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {ROLES.map((role) => {
                      const inRole = champions.filter((c) => c.roles?.includes(role));
                      const safeEntries = inRole
                        .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
                        .slice(0, 4);
                      if (safeEntries.length === 0) return null;
                      return (
                        <div key={role} className="space-y-3">
                          <div className="flex items-center gap-2 mb-2 border-b border-pc-border pb-1">
                            <Image
                              src={role === "Frontline" ? "/images/icons/Class_Front_Line_Icon.avif" : `/images/icons/Class_${role}_Icon.avif`}
                              alt={role}
                              width={20}
                              height={20}
                              style={{ opacity: 0.85 }}
                            />
                            <span className="text-sm font-medium text-pc-text-muted">{role}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-x-3 gap-y-4">
                            {safeEntries.map((c) => (
                              <Link
                                key={c.id}
                                href={`/champions/${championSlug(c.name)}`}
                                className="group flex min-w-0 flex-col items-center gap-1 text-center"
                              >
                                <Image
                                  src={getChampionIconSafe(c.name)}
                                  alt={c.name}
                                  width={48}
                                  height={48}
                                  className="rounded-lg group-hover:ring-2 ring-pc-accent transition-all"
                                />
                                <span className="max-w-full truncate text-xs leading-tight text-pc-text-muted group-hover:text-pc-accent transition-colors">
                                  {c.name}
                                </span>
                                <span className="text-xs font-mono text-pc-text-muted">
                                  {c.winRate != null ? `${(c.winRate * 100).toFixed(1)}%` : "N/A"}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Most Banned */}
            <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}>
              <Card style={{ maxWidth: "none" }}>
                <div className="pc-card-title mb-4">
                  <ScrambleText text="Most Banned" speed={45} iterations={3} delayFromCenter={false} />
                </div>
                {loading ? (
                  <div className="space-y-4">
                    {ROLES.map((role) => (
                      <div key={role}>
                        <h3 className="text-pc-text font-medium text-sm mb-3">{role}</h3>
                        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="pc-skeleton h-16 w-full mb-3" />)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {ROLES.map((role) => {
                      const inRole = champions.filter((c) => c.roles?.includes(role));
                      const bannedEntries = inRole
                        .sort((a, b) => (b.banRate ?? 0) - (a.banRate ?? 0))
                        .slice(0, 4);
                      if (bannedEntries.length === 0) return null;
                      return (
                        <div key={role} className="space-y-3">
                          <div className="flex items-center gap-2 mb-2 border-b border-pc-border pb-1">
                            <Image
                              src={role === "Frontline" ? "/images/icons/Class_Front_Line_Icon.avif" : `/images/icons/Class_${role}_Icon.avif`}
                              alt={role}
                              width={20}
                              height={20}
                              style={{ opacity: 0.85 }}
                            />
                            <span className="text-sm font-medium text-pc-text-muted">{role}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-x-3 gap-y-4">
                            {bannedEntries.map((c) => (
                              <Link
                                key={c.id}
                                href={`/champions/${championSlug(c.name)}`}
                                className="group flex min-w-0 flex-col items-center gap-1 text-center"
                              >
                                <Image
                                  src={getChampionIconSafe(c.name)}
                                  alt={c.name}
                                  width={48}
                                  height={48}
                                  className="rounded-lg group-hover:ring-2 ring-pc-accent transition-all"
                                />
                                <span className="max-w-full truncate text-xs leading-tight text-pc-text-muted group-hover:text-pc-accent transition-colors">
                                  {c.name}
                                </span>
                                <span className="text-xs font-mono text-pc-text-muted">
                                  {c.banRate != null ? `${(c.banRate * 100).toFixed(1)}%` : "N/A"}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            {/* Leaderboard */}
            <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-pc-border">
                  <div className="flex items-center justify-between">
                    <span className="pc-card-title mb-0">Leaderboard</span>
                    <Link href="/players/leaderboard" className="text-[10px] px-2 py-0.5 rounded bg-pc-bg text-pc-accent hover:bg-pc-accent hover:text-pc-bg transition-colors">
                      Detail →
                    </Link>
                  </div>
                </div>
                {loading ? (
                  <div className="p-4 space-y-3">
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                  </div>
                ) : rankedPlayers.length === 0 ? (
                  <div className="p-4">
                    <p className="text-pc-text-muted text-sm">No data yet</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-pc-border">
                        <th className="text-left text-pc-text-muted font-medium py-2.5 px-3 w-10">#</th>
                        <th className="text-left text-pc-text-muted font-medium py-2.5 px-3">Player</th>
                        <th className="text-right text-pc-text-muted font-medium py-2.5 px-3">Points</th>
                        <th className="text-right text-pc-text-muted font-medium py-2.5 px-3 w-12">+/−</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedPlayers.map((player, i) => (
                        <tr key={player.player_id} className={`border-b border-pc-border/50 hover:bg-pc-bg/50 transition-colors ${i < 3 ? "bg-pc-bg/30" : ""}`}>
                          <td className="py-2 px-3">
                            {i === 0 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-sm">🥇</span>
                            ) : i === 1 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-400/20 text-gray-300 font-bold text-sm">🥈</span>
                            ) : i === 2 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600/20 text-amber-600 font-bold text-sm">🥉</span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-7 h-7 text-pc-text-muted text-sm">{player.rank}</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <Link href={`/players/${player.player_id}`} className="text-pc-text font-medium text-xs hover:text-pc-accent transition-colors">
                              {player.name}
                            </Link>
                          </td>
                          <td className="py-2 px-3 text-right text-pc-text font-medium text-xs">{player.points.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right">
                            {player.trend != null && player.trend !== 0 ? (
                              <span className={`text-xs ${player.trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {player.trend > 0 ? "▲" : "▼"}{Math.abs(player.trend)}
                              </span>
                            ) : (
                              <span className="text-pc-text-muted text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        </div>
    </div>
  );
}
