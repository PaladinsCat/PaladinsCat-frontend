"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  fetchChampionDetail,
  fetchChampionCounters,
  type ChampionDetail,
  type CounterStats,
} from "@/lib/api-client";
import WinRateChart from "@/components/WinRateChart";

export default function ChampionDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [champion, setChampion] = useState<ChampionDetail | null>(null);
  const [counters, setCounters] = useState<CounterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // P1: Reduced from 4 API calls → 2 (detail endpoint now includes tier_stats + patch_trends)
  useEffect(() => {
    if (!id) return;
    const parsed = parseInt(id, 10);
    if (isNaN(parsed)) {
      setError("Invalid champion ID");
      setLoading(false);
      return;
    }

    Promise.all([
      fetchChampionDetail(parsed),
      fetchChampionCounters(parsed),
    ])
      .then(([championData, counterData]) => {
        setChampion(championData);
        setCounters(counterData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load champion"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-8 text-pc-text-secondary">Loading champion...</div>;
  if (error) return <div className="text-center py-8 text-pc-text-muted">{error}</div>;
  if (!champion) return <div className="text-center py-8 text-pc-text-muted">Champion not found</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/champions" className="text-pc-text-secondary hover:text-pc-accent transition-colors">
          ← Back to all champions
        </Link>
        <h1 className="text-3xl font-bold text-pc-accent">{champion.name}</h1>
      </div>

      {/* Basic Info */}
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {champion.class && (
            <div>
              <p className="text-pc-text-secondary text-sm">Class</p>
              <p className="text-pc-text font-semibold">{champion.class}</p>
            </div>
          )}
          {champion.cost != null && (
            <div>
              <p className="text-pc-text-secondary text-sm">Cost</p>
              <p className="text-pc-text font-semibold">{champion.cost}</p>
            </div>
          )}
          {champion.totalPlays != null && (
            <div>
              <p className="text-pc-text-secondary text-sm">Total Plays</p>
              <p className="text-pc-text font-semibold">{champion.totalPlays}</p>
            </div>
          )}
          {champion.totalMatches != null && (
            <div>
              <p className="text-pc-text-secondary text-sm">Total Matches</p>
              <p className="text-pc-text font-semibold">{champion.totalMatches}</p>
            </div>
          )}
        </div>
      </div>

      {/* Glicko-2 Ratings */}
      {champion.ratings && (
        <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
          <h2 className="text-xl font-semibold mb-4 text-pc-accent">Glicko-2 Ratings</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-pc-text-secondary text-sm">Rating (R)</p>
              <p className="text-pc-text font-semibold text-lg">{champion.ratings.rating?.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-pc-text-secondary text-sm">Deviation (RD)</p>
              <p className="text-pc-text font-semibold text-lg">{champion.ratings.deviation?.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-pc-text-secondary text-sm">Volatility (σ)</p>
              <p className="text-pc-text font-semibold text-lg">{champion.ratings.volatility?.toFixed(4)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tier Stats — now included in detail response */}
      {champion.tierStats && champion.tierStats.length > 0 && (
        <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
          <h2 className="text-xl font-semibold mb-4 text-pc-accent">Performance by Tier</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-pc-bg-secondary">
                <tr>
                  <th className="px-4 py-2 text-pc-text-secondary">Tier</th>
                  <th className="px-4 py-2 text-pc-text-secondary">Win Rate</th>
                  <th className="px-4 py-2 text-pc-text-secondary">Pick Rate</th>
                  <th className="px-4 py-2 text-pc-text-secondary">Total Plays</th>
                </tr>
              </thead>
              <tbody>
                {champion.tierStats.map((tier) => (
                  <tr key={tier.tier} className="border-t border-pc-border">
                    <td className="px-4 py-2 text-pc-text">{tier.tier}</td>
                    <td className="px-4 py-2 text-pc-text">{tier.winRate?.toFixed(1)}%</td>
                    <td className="px-4 py-2 text-pc-text">{tier.pickRate?.toFixed(1)}%</td>
                    <td className="px-4 py-2 text-pc-text">{tier.totalPlays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patch Trends — now included in detail response */}
      {champion.patchTrends && champion.patchTrends.length > 0 && (
        <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
          <h2 className="text-xl font-semibold mb-4 text-pc-accent">Performance Over Time</h2>
          <WinRateChart data={champion.patchTrends} championName={champion.name} />
        </div>
      )}

      {/* Counter-pick Data */}
      {counters && (
        <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
          <h2 className="text-xl font-semibold mb-4 text-pc-accent">Counter-Pick Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-pc-accent mb-2">Strong Against</h3>
              {counters.strongAgainst.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-pc-bg-secondary">
                      <tr>
                        <th className="px-4 py-2 text-pc-text-secondary">Champion</th>
                        <th className="px-4 py-2 text-pc-text-secondary">Win Rate</th>
                        <th className="px-4 py-2 text-pc-text-secondary">Plays</th>
                      </tr>
                    </thead>
                    <tbody>
                      {counters.strongAgainst.map((c) => (
                        <tr key={c.opponentChampionId} className="border-t border-pc-border">
                          <td className="px-4 py-2 text-pc-text">{c.opponentChampionName}</td>
                          <td className="px-4 py-2 text-pc-text">{c.winRate?.toFixed(1)}%</td>
                          <td className="px-4 py-2 text-pc-text">{c.totalMatches}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-pc-text-secondary">No data</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-pc-text-muted mb-2">Weak Against</h3>
              {counters.weakAgainst.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-pc-bg-secondary">
                      <tr>
                        <th className="px-4 py-2 text-pc-text-secondary">Champion</th>
                        <th className="px-4 py-2 text-pc-text-secondary">Win Rate</th>
                        <th className="px-4 py-2 text-pc-text-secondary">Plays</th>
                      </tr>
                    </thead>
                    <tbody>
                      {counters.weakAgainst.map((c) => (
                        <tr key={c.opponentChampionId} className="border-t border-pc-border">
                          <td className="px-4 py-2 text-pc-text">{c.opponentChampionName}</td>
                          <td className="px-4 py-2 text-pc-text">{c.winRate?.toFixed(1)}%</td>
                          <td className="px-4 py-2 text-pc-text">{c.totalMatches}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-pc-text-secondary">No data</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
