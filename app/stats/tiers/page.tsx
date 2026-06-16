"use client";

import { useEffect, useState } from "react";
import { fetchTiers, type TierStat } from "@/lib/api-client";

export default function TiersPage() {
  const [tiers, setTiers] = useState<TierStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTiers()
      .then(setTiers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-pc-accent">Tier Distribution</h1>
      {loading ? (
        <div className="text-center py-8 text-pc-text-secondary">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-pc-text-muted">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-pc-bg-elevated">
              <tr>
                <th className="px-4 py-2 text-pc-accent font-semibold">Tier</th>
                <th className="px-4 py-2 text-pc-accent font-semibold">Total Plays</th>
                <th className="px-4 py-2 text-pc-accent font-semibold">Avg Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.tier} className="border-t border-pc-border">
                  <td className="px-4 py-2 text-pc-text">{t.tier}</td>
                  <td className="px-4 py-2 text-pc-text">{t.totalPlays}</td>
                  <td className="px-4 py-2 text-pc-text">{t.avgWinRate?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
