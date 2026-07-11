"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { fetchRegions, type RegionStat } from "@/lib/api-client";
import { EmptyState, ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";

export default function RegionsPage() {
  const [regions, setRegions] = useState<RegionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRegions()
      .then(setRegions)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="pc-heading pc-heading-lg text-pc-accent">Regional Meta</h1>

      {loading ? (
        <RouteSkeleton variant="dashboard" />
      ) : error ? (
        <ErrorState message={String(error)} />
      ) : regions.length === 0 ? (
        <EmptyState title="No regional statistics" description="Regional champion trends will appear when ranked data is available." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regions.map((r) => (
            <Card key={r.regionCode} title={r.regionName}>
              <p className="pc-body text-sm mb-4">{r.continent}</p>
              <div className="space-y-2">
                {r.topChampions.slice(0, 5).map((c) => (
                  <div key={c.championId} className="flex items-center justify-between text-sm">
                    <span className="text-pc-text">{c.championName}</span>
                    <span className="pc-badge">{c.winRate?.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
