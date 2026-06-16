"use client";

import { useEffect, useState } from "react";
import { fetchPlatforms, type LoadoutStat } from "@/lib/api-client";
import { BarChartComponent } from "@/components/Chart";

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Array<{ platform: string; championId: number; championName: string; totalMatches: number; winRate: number; avgDpm: number; avgHpm: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatforms()
      .then(setPlatforms)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const platformData = selectedPlatform
    ? platforms.filter((p) => p.platform === selectedPlatform)
    : platforms;

  const chartData = platformData
    .sort((a, b) => (b.winRate || 0) - (a.winRate || 0))
    .slice(0, 10)
    .map((p) => ({
      champion: p.championName,
      winRate: p.winRate,
    }));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-pc-accent">Platform Meta</h1>
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedPlatform(null)}
          className={`px-4 py-2 rounded-lg border border-pc-border text-pc-text ${
            !selectedPlatform ? "bg-pc-accent text-pc-bg" : "bg-pc-bg-elevated hover:bg-pc-bg-secondary"
          }`}
        >
          All
        </button>
        {[...new Set(platforms.map((p) => p.platform))].map((platform) => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`px-4 py-2 rounded-lg border border-pc-border text-pc-text ${
              selectedPlatform === platform ? "bg-pc-accent text-pc-bg" : "bg-pc-bg-elevated hover:bg-pc-bg-secondary"
            }`}
          >
            {platform}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center py-8 text-pc-text-secondary">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-pc-text-muted">{error}</div>
      ) : (
        <BarChartComponent
          data={chartData}
          xKey="champion"
          yKeys={["winRate"]}
          yLabel="Win Rate (%)"
          title={selectedPlatform ? `${selectedPlatform} — Top Champions` : "Top Champions (All Platforms)"}
          height={400}
          colors={["#4ade80"]}
          showLegend={false}
          showXAxis={false}
        />
      )}
    </div>
  );
}
