"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { fetchLeaderboard, fetchPatchTrends, type LeaderboardEntry, type PatchTrendEntry } from "@/lib/api-client";
import LeaderboardChart from "@/components/LeaderboardChart";

type SortKey = "championName" | "winRate" | "totalPlays" | "rating";
type SortDir = "asc" | "desc";

export default function StatsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [trends, setTrends] = useState<PatchTrendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<string | null>(null);
  const [filterRegion, setFilterRegion] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("winRate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchLeaderboard({ tier: filterTier || undefined, region: filterRegion || undefined });
        setLeaderboard(data);
      } catch {
        setError("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filterTier, filterRegion]);

  useEffect(() => {
    fetchPatchTrends()
      .then(setTrends)
      .catch(() => {});
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...leaderboard].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="space-y-6">
      <h1 className="pc-heading pc-heading-lg text-pc-accent">Stats</h1>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterTier || ""}
          onChange={(e) => setFilterTier(e.target.value || null)}
          className="pc-select"
        >
          <option value="">All Tiers</option>
          {["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={filterRegion || ""}
          onChange={(e) => setFilterRegion(e.target.value || null)}
          className="pc-select"
        >
          <option value="">All Regions</option>
          {["NA", "EU", "ASIA", "OCE"].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="text-center py-8 text-pc-text-secondary">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-pc-text-muted">{error}</div>
      ) : (
        <LeaderboardChart data={leaderboard} maxRows={15} />
      )}

      {/* Sortable Leaderboard Table */}
      {!loading && !error && leaderboard.length > 0 && (
        <Card title="Leaderboard">
          <div className="overflow-x-auto">
            <table className="pc-table">
              <thead>
                <tr>
                  <th className="cursor-pointer hover:text-pc-accent-light" onClick={() => handleSort("championName")}>
                    Champion{sortArrow("championName")}
                  </th>
                  <th className="cursor-pointer hover:text-pc-accent-light" onClick={() => handleSort("winRate")}>
                    Win Rate{sortArrow("winRate")}
                  </th>
                  <th className="cursor-pointer hover:text-pc-accent-light" onClick={() => handleSort("totalPlays")}>
                    Plays{sortArrow("totalPlays")}
                  </th>
                  <th className="cursor-pointer hover:text-pc-accent-light" onClick={() => handleSort("rating")}>
                    Rating{sortArrow("rating")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 20).map((entry) => (
                  <tr key={entry.championId}>
                    <td>{entry.championName}</td>
                    <td>{entry.winRate}%</td>
                    <td>{entry.totalPlays.toLocaleString()}</td>
                    <td>{entry.rating ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Patch Trends */}
      {trends.length > 0 && (
        <Card title="Recent Patch Trends">
          <div className="overflow-x-auto">
            <table className="pc-table">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Patch</th>
                  <th>Champion</th>
                  <th>Win Rate</th>
                  <th>Plays</th>
                </tr>
              </thead>
              <tbody>
                {trends.slice(0, 20).map((t) => (
                  <tr key={t.trendWeek}>
                    <td>{t.trendWeek}</td>
                    <td>{t.patchVersion}</td>
                    <td>{t.championName}</td>
                    <td>{t.weeklyWinRate?.toFixed(1)}%</td>
                    <td>{t.weeklyPlays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
