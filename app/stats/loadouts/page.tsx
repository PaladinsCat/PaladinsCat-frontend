"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { fetchLoadouts, type LoadoutStat } from "@/lib/api-client";
import { EmptyState, ErrorState } from "@/components/async-state";
import { DataTableSkeleton } from "@/components/route-skeleton";

type SortKey = "championName" | "totalUses" | "winRate" | "avgDpm" | "avgHpm";
type SortDir = "asc" | "desc";

export default function LoadoutsPage() {
  const [loadouts, setLoadouts] = useState<LoadoutStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("winRate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetchLoadouts()
      .then(setLoadouts)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...loadouts].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="space-y-6">
      <h1 className="pc-heading pc-heading-lg text-pc-accent">Loadout Meta</h1>

      {loading ? (
        <DataTableSkeleton />
      ) : error ? (
        <ErrorState message={String(error)} />
      ) : sorted.length === 0 ? (
        <EmptyState title="No loadout statistics" description="Loadout combinations will appear after enough ranked matches are processed." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="pc-table">
              <thead>
                <tr>
                  <th className="cursor-pointer hover:text-pc-accent-light" onClick={() => handleSort("championName")}>
                    Champion{sortArrow("championName")}
                  </th>
                  <th>Deck Hash</th>
                  <th className="cursor-pointer hover:text-pc-accent-light" onClick={() => handleSort("totalUses")}>
                    Plays{sortArrow("totalUses")}
                  </th>
                  <th className="cursor-pointer hover:text-pc-accent-light" onClick={() => handleSort("winRate")}>
                    Win Rate{sortArrow("winRate")}
                  </th>
                  <th className="cursor-pointer hover:text-pc-accent-light" onClick={() => handleSort("avgDpm")}>
                    Avg DPM{sortArrow("avgDpm")}
                  </th>
                  <th className="cursor-pointer hover:text-pc-accent-light" onClick={() => handleSort("avgHpm")}>
                    Avg HPM{sortArrow("avgHpm")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 20).map((l) => (
                  <tr key={l.deckHash}>
                    <td>{l.championName}</td>
                    <td className="text-pc-text-secondary">{l.deckHash}</td>
                    <td>{l.totalUses}</td>
                    <td>{l.winRate?.toFixed(1)}%</td>
                    <td>{l.avgDpm?.toFixed(0)}</td>
                    <td>{l.avgHpm?.toFixed(0)}</td>
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
