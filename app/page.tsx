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

        {/* ── Notifications ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="max-w-2xl mx-auto mb-8 space-y-3"
        >
          <h2 className="px-2 text-sm font-bold text-pc-text">Notifications</h2>
          {[
            { type: "info", text: "Database ingestion running — 5,318 matches tracked and growing.", time: "2 hours ago" },
            { type: "update", text: "Champion stats now available on the /stats page with per-class breakdowns.", time: "1 day ago" },
            { type: "info", text: "Ranked leaderboard live with tier filters from Bronze to Grandmaster.", time: "3 days ago" },
          ].map((n, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-pc-bg-elevated border border-pc-border">
              <div className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${n.type === "update" ? "bg-pc-accent" : "bg-pc-text-muted"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-pc-text-secondary text-sm leading-relaxed">{n.text}</p>
                <span className="text-pc-text-muted text-[10px] mt-1 block">{n.time}</span>
              </div>
            </div>
          ))}
        </motion.div>
    </div>
  );
}
