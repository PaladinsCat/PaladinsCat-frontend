"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/Card";
import { fetchChampions, type Champion } from "@/lib/api-client";

const ROLES = ["Frontline", "Damage", "Flank", "Support"] as const;
const TIERS = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster"] as const;

export default function ChampionTable() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<string | null>(null);
  const [filterRegion, setFilterRegion] = useState<string | null>(null);
  const [filterPatch, setFilterPatch] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadChampions = async () => {
      try {
        const data = await fetchChampions({
          tier: filterTier || undefined,
          region: filterRegion || undefined,
          patch: filterPatch || undefined,
        });
        setChampions(data);
      } catch {
        setError("Failed to load champions");
      } finally {
        setLoading(false);
      }
    };
    loadChampions();
  }, [filterTier, filterRegion, filterPatch]);

  const filtered = champions.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="pc-heading pc-heading-lg text-pc-accent">Champions</h1>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search champions..."
          className="pc-input max-w-xs"
        />
        <select
          value={filterTier || ""}
          onChange={(e) => setFilterTier(e.target.value || null)}
          className="pc-select"
        >
          <option value="">All Tiers</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={filterRegion || ""}
          onChange={(e) => setFilterRegion(e.target.value || null)}
          className="pc-select"
        >
          <option value="">All Regions</option>
          <option value="NA">NA</option>
          <option value="EU">EU</option>
          <option value="ASIA">ASIA</option>
          <option value="OCE">OCE</option>
        </select>
        <select
          value={filterPatch || ""}
          onChange={(e) => setFilterPatch(e.target.value || null)}
          className="pc-select"
        >
          <option value="">All Patches</option>
          <option value="1.0.0">1.0.0</option>
          <option value="1.1.0">1.1.0</option>
          <option value="1.2.0">1.2.0</option>
        </select>
      </div>

      {/* Champion Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="pc-card p-6">
              <div className="pc-skeleton h-24 w-full mb-4" />
              <div className="pc-skeleton h-5 w-3/4 mb-2" />
              <div className="pc-skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="pc-card text-center">
          <p className="pc-body">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="pc-card text-center">
          <p className="pc-body">No champions matched your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <Link key={c.id} href={`/champions/${c.id}`}>
              <div className="pc-card group transition-transform duration-200 hover:scale-[1.02]">
                {/* Champion portrait */}
                {c.imagePath ? (
                  <div className="w-full h-24 rounded-lg bg-pc-bg mb-4 flex items-center justify-center overflow-hidden">
                    <img src={c.imagePath} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-lg bg-pc-bg mb-4 flex items-center justify-center">
                    <span className="text-3xl font-bold text-pc-accent">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Name */}
                <h3 className="text-pc-text font-semibold text-base mb-2 group-hover:text-pc-accent transition-colors">
                  {c.name}
                </h3>

                {/* Winrate bar */}
                {c.winRate != null && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="pc-label">Win Rate</span>
                      <span className="text-pc-text text-sm font-medium">{c.winRate}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-pc-bg overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-pc-accent-deep to-pc-accent transition-all duration-500"
                        style={{ width: `${Math.min(c.winRate, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Pick + Ban rate stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="pc-label">Pick Rate</span>
                    <div className="text-pc-text text-sm font-medium">
                      {c.pickRate != null ? `${c.pickRate}%` : "—"}
                    </div>
                  </div>
                  <div>
                    <span className="pc-label">Ban Rate</span>
                    <div className="text-pc-text text-sm font-medium">
                      {c.banRate != null ? `${c.banRate}%` : "—"}
                    </div>
                  </div>
                </div>

                {/* Rating badge */}
                {c.rating != null && (
                  <div className="mt-3">
                    <span className="pc-badge">Rating: {c.rating}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
