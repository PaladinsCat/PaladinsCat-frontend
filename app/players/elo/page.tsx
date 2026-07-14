"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  fetchChampionElo,
  fetchClassLeaderboard,
  type ChampionEloEntry,
  type ClassLeaderboardEntry,
} from "@/lib/api-client";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";

import { useSearchParams } from "next/navigation";
type ELOMode = "champion" | "account";

const CLASS_ICONS: Record<string, string> = {
  Frontline: "/images/icons/Class_Front_Line_Icon.avif",
  Damage: "/images/icons/Class_Damage_Icon.avif",
  Flank: "/images/icons/Class_Flank_Icon.avif",
  Support: "/images/icons/Class_Support_Icon.avif",
};

const TABS = [
  { key: "global", label: "Global", role: undefined },
  { key: "Frontline", label: "Frontline", role: "Frontline" },
  { key: "Damage", label: "Damage", role: "Damage" },
  { key: "Flank", label: "Flank", role: "Flank" },
  { key: "Support", label: "Support", role: "Support" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-sm">🥇</span>;
  if (rank === 2)
    return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-400/20 text-gray-300 font-bold text-sm">🥈</span>;
  if (rank === 3)
    return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600/20 text-amber-600 font-bold text-sm">🥉</span>;
  return <span className="inline-flex items-center justify-center w-7 h-7 text-pc-text-muted text-sm">{rank}</span>;
}

export default function ChampionEloPage() {
  return (
    <Suspense fallback={<LoadingPanel />}>
      <ChampionEloContent />
    </Suspense>
  );
}

function ChampionEloContent() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") === "account" || searchParams.get("mode") === "champion") 
    ? searchParams.get("mode") as ELOMode 
    : "champion";
  const [eloMode, setEloMode] = useState<ELOMode>(initialMode);
  const [activeTab, setActiveTab] = useState<TabKey>("global");
  const [players, setPlayers] = useState<ChampionEloEntry[]>([]);
  const [accountPlayers, setAccountPlayers] = useState<ClassLeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Champion dropdown state (only shown within a class tab)
  const [selectedChampionId, setSelectedChampionId] = useState<number | null>(null);
  const [championSearch, setChampionSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeRole = TABS.find((t) => t.key === activeTab)?.role;

  // Build champion name → real ID mapping from ELO data
  const championNameToId = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of players) {
      map.set(p.champion_name.toLowerCase(), p.champion_id);
    }
    return map;
  }, [players]);

  // Champions filtered by active class (from STATIC_CHAMPIONS)
  const classChampions = useMemo(() => {
    if (!activeRole) return [];
    return STATIC_CHAMPIONS.filter((c) => {
      const roles = Array.isArray(c.roles) ? c.roles : [c.roles];
      return roles.some((r) => r.toLowerCase() === activeRole.toLowerCase());
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeRole]);

  // Filtered champions for dropdown search
  const filteredChampions = useMemo(() => {
    const q = championSearch.trim().toLowerCase();
    if (!q) return classChampions;
    return classChampions.filter((c) => c.name.toLowerCase().includes(q));
  }, [classChampions, championSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch data when tab or champion changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: { role?: string; championId?: number; limit: number; queueId: number } = {
      limit: 100,
      queueId: 486,
    };

    if (selectedChampionId) {
      params.championId = selectedChampionId;
    } else if (activeRole) {
      params.role = activeRole;
    }

    fetchChampionElo(params)
      .then((result) => {
        if (cancelled) return;
        setPlayers(result.data);
        setTotal(result.total);
      })
      .catch(() => {
        if (cancelled) return;
        setPlayers([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, selectedChampionId, activeRole]);

  // Fetch account-level ELO when in account mode
  useEffect(() => {
    if (eloMode !== "account") return;
    let cancelled = false;
    setLoading(true);

    fetchClassLeaderboard({ role: "Frontline", limit: 100, queueId: 486, mode: "account" })
      .then((result) => {
        if (cancelled) return;
        setAccountPlayers(result);
      })
      .catch(() => {
        if (!cancelled) setAccountPlayers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [eloMode]);

  // Reset champion selection when switching tabs
  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setSelectedChampionId(null);
    setChampionSearch("");
    setDropdownOpen(false);
  };

  const handleSelectChampion = (championId: number) => {
    // Convert the lightweight STATIC_CHAMPIONS roster ID to the DB champion ID.
    const champ = STATIC_CHAMPIONS.find((c) => c.id === championId);
    if (champ) {
      const realId = championNameToId.get(champ.name.toLowerCase());
      setSelectedChampionId(realId ?? championId);
      setChampionSearch(champ.name);
      setDropdownOpen(false);
    }
  };

  const handleClearChampion = () => {
    setSelectedChampionId(null);
    setChampionSearch("");
  };

  const selectedChampion = selectedChampionId
    ? STATIC_CHAMPIONS.find((c) => championNameToId.get(c.name.toLowerCase()) === selectedChampionId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/players" className="text-pc-accent text-xs hover:underline mb-2 inline-block">← Players</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">
          {eloMode === "champion" ? "Champion ELO" : "Account ELO"}
        </h1>
        <p className="text-pc-text-muted text-sm mt-2">
          {eloMode === "account"
            ? "Top players by their overall account Glicko-2 rating (all champions combined)"
            : selectedChampion
              ? `Top players for ${selectedChampion.name}`
              : activeTab === "global"
                ? "Top 100 players by their best champion's Glicko-2 rating"
                : `Top ${activeTab} players by their best champion's Glicko-2 rating`}
          {total > 0 && <span className="text-pc-text-secondary ml-1">({total.toLocaleString()} rated)</span>}
        </p>
      </div>

      {/* Mode toggle: Champion vs Account */}
      <div className="flex gap-2">
        <button
          onClick={() => setEloMode("champion")}
          className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors ${
            eloMode === "champion"
              ? "bg-pc-accent/20 text-pc-accent border border-pc-accent/40"
              : "bg-pc-bg-elevated text-pc-text-muted border border-pc-border hover:text-pc-text"
          }`}
        >
          Champion ELO
        </button>
        <button
          onClick={() => setEloMode("account")}
          className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors ${
            eloMode === "account"
              ? "bg-pc-accent/20 text-pc-accent border border-pc-accent/40"
              : "bg-pc-bg-elevated text-pc-text-muted border border-pc-border hover:text-pc-text"
          }`}
        >
          Account ELO
        </button>
      </div>

      {/* Tabs + Champion Dropdown + Search */}
      {eloMode === "champion" && (
      <div className="relative z-20 bg-pc-bg-elevated border border-pc-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Class tabs */}
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? "bg-pc-accent text-pc-bg font-medium"
                    : "bg-pc-card text-pc-text-muted hover:text-pc-text"
                }`}
              >
                {tab.role && (
                  <img src={CLASS_ICONS[tab.role]} alt={tab.role} className="w-4 h-4" />
                )}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Champion dropdown (only in class tabs) */}
          {activeRole && (
            <div className="flex items-center gap-2 ml-auto" ref={dropdownRef}>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-pc-card text-pc-text-muted hover:text-pc-text border border-pc-border transition-colors"
                >
                  {selectedChampion ? (
                    <>
                      <img src={getChampionIconSafe(selectedChampion.name)} alt={selectedChampion.name} className="w-4 h-4 object-contain" />
                      {selectedChampion.name}
                    </>
                  ) : (
                    "All Champions"
                  )}
                  <span className="text-xs ml-1">▾</span>
                </button>

                {dropdownOpen && (
                  <div className="pc-card--opaque absolute top-full left-0 mt-1 z-50 w-56 overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated shadow-lg">
                    <div className="max-h-64 overflow-y-auto">
                      {/* "All" option */}
                      <button
                        onClick={() => { setSelectedChampionId(null); setChampionSearch(""); setDropdownOpen(false); }}
                        className={`w-full text-left text-xs px-3 py-2 hover:bg-pc-bg/50 transition-colors flex items-center gap-2 ${
                          !selectedChampionId ? "text-pc-accent bg-pc-accent/10" : "text-pc-text"
                        }`}
                      >
                        All {activeRole} Champions
                      </button>
                      {filteredChampions.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectChampion(c.id)}
                          className={`w-full text-left text-xs px-3 py-2 hover:bg-pc-bg/50 transition-colors flex items-center gap-2 ${
                            selectedChampionId === c.id ? "text-pc-accent bg-pc-accent/10" : "text-pc-text"
                          }`}
                        >
                          <img src={getChampionIconSafe(c.name)} alt={c.name} className="w-5 h-5 object-contain rounded" />
                          {c.name}
                        </button>
                      ))}
                      {filteredChampions.length === 0 && (
                        <div className="text-xs text-pc-text-muted px-3 py-2">No champions found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Champion search bar */}
              <div className="relative w-48">
                <input
                  type="text"
                  value={championSearch}
                  onChange={(e) => {
                    setChampionSearch(e.target.value);
                    // If typing matches a champion exactly, auto-select
                    const match = classChampions.find(
                      (c) => c.name.toLowerCase() === e.target.value.trim().toLowerCase()
                    );
                    if (match) {
                      const realId = championNameToId.get(match.name.toLowerCase());
                      setSelectedChampionId(realId ?? match.id);
                      setDropdownOpen(false);
                    }
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    const nearestChampion = filteredChampions[0];
                    if (!nearestChampion) return;
                    event.preventDefault();
                    handleSelectChampion(nearestChampion.id);
                  }}
                  placeholder="Search champion..."
                  className="pc-input pr-8 w-full text-xs"
                />
                {championSearch && (
                  <button
                    onClick={handleClearChampion}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-pc-text-muted hover:text-pc-text text-xs"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>)}

      {/* Table */}
      {eloMode === "champion" ? (
        loading ? (
          <LoadingPanel compact />
        ) : players.length === 0 ? (
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl text-center py-12">
            <p className="text-pc-text-muted">
              {selectedChampion
                ? `No ELO data for ${selectedChampion.name} yet.`
                : `No champion ELO data available.`}
            </p>
          </div>
        ) : (
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pc-border">
                    <th className="text-left text-pc-text-muted font-medium py-3 px-4 w-14">Rank</th>
                    <th className="text-left text-pc-text-muted font-medium py-3 px-4">Player</th>
                    <th className="text-left text-pc-text-muted font-medium py-3 px-4">Champion</th>
                    <th className="text-left text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">Class</th>
                    <th className="text-right text-pc-text-muted font-medium py-3 px-4">ELO</th>
                    <th className="text-right text-pc-text-muted font-medium py-3 px-4">Win Rate</th>
                    <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">Matches</th>
                    <th className="text-center text-pc-text-muted font-medium py-3 px-4 hidden lg:table-cell">Region</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, i) => (
                    <tr
                      key={`${p.player_id}-${p.champion_id}`}
                      className={`border-b border-pc-border/50 hover:bg-pc-bg/60 transition-colors ${i < 3 ? "bg-pc-bg/30" : ""}`}
                    >
                      <td className="py-2.5 px-4">
                        <RankBadge rank={p.rank} />
                      </td>
                      <td className="py-2.5 px-4">
                        <Link href={`/players/${p.player_id}`} className="text-pc-text font-medium hover:text-pc-accent transition-colors">
                          <PlayerName playerId={p.player_id}>{p.player_name}</PlayerName>
                        </Link>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <img src={getChampionIconSafe(p.champion_name)} alt={p.champion_name} className="w-6 h-6 object-contain rounded" />
                          <span className="text-pc-text-secondary text-xs">{p.champion_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          {CLASS_ICONS[p.class_name] && (
                            <img src={CLASS_ICONS[p.class_name]} alt={p.class_name} className="w-4 h-4" />
                          )}
                          <span className="text-pc-text-muted text-xs">{p.class_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right text-pc-accent font-bold">
                        {Math.round(p.elo)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {p.win_rate != null ? (
                          <span className={p.win_rate >= 50 ? "text-emerald-400 font-medium" : "text-red-400"}>
                            {p.win_rate.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-pc-text-muted">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right text-pc-text-secondary hidden md:table-cell">
                        {p.total_matches.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-center hidden lg:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded bg-pc-bg text-pc-text-muted">
                          {p.region ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Account ELO table */
        loading ? (
          <LoadingPanel compact />
        ) : accountPlayers.length === 0 ? (
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl text-center py-12">
            <p className="text-pc-text-muted">No account ELO data available.</p>
          </div>
        ) : (
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pc-border">
                    <th className="text-left text-pc-text-muted font-medium py-3 px-4 w-14">Rank</th>
                    <th className="text-left text-pc-text-muted font-medium py-3 px-4">Player</th>
                    <th className="text-right text-pc-text-muted font-medium py-3 px-4">ELO</th>
                    <th className="text-right text-pc-text-muted font-medium py-3 px-4">Win Rate</th>
                    <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">Matches</th>
                    <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">Wins</th>
                    <th className="text-center text-pc-text-muted font-medium py-3 px-4 hidden lg:table-cell">Region</th>
                  </tr>
                </thead>
                <tbody>
                  {accountPlayers.map((p, i) => (
                    <tr
                      key={`account-${p.playerId}`}
                      className={`border-b border-pc-border/50 hover:bg-pc-bg/60 transition-colors ${i < 3 ? "bg-pc-bg/30" : ""}`}
                    >
                      <td className="py-2.5 px-4">
                        <RankBadge rank={p.rank} />
                      </td>
                      <td className="py-2.5 px-4">
                        <Link href={`/players/${p.playerId}`} className="text-pc-text font-medium hover:text-pc-accent transition-colors">
                          <PlayerName playerId={p.playerId}>{p.playerName}</PlayerName>
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 text-right text-pc-accent font-bold">
                        {p.elo.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {p.winRate != null ? (
                          <span className={p.winRate >= 50 ? "text-emerald-400 font-medium" : "text-red-400"}>
                            {p.winRate.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-pc-text-muted">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right text-pc-text-secondary hidden md:table-cell">
                        {p.totalMatches.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right text-pc-text-secondary hidden md:table-cell">
                        {p.totalWins.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-center hidden lg:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded bg-pc-bg text-pc-text-muted">
                          {p.region ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
