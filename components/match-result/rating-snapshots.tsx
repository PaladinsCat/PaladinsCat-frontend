"use client";

import type { RatingSnapshot } from "@/lib/api-client";

export default function RatingSnapshots({ snapshots }: { snapshots: RatingSnapshot[] }) {
  if (snapshots.length === 0) return null;

  const formatRating = (value: number | null) => value == null ? "—" : value.toFixed(2);
  const formatChange = (value: number | null) => {
    if (value == null) return "—";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
  };

  return (
    <section className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 sm:p-6">
      <h2 className="text-lg font-bold text-pc-text uppercase tracking-wide mb-4">Rating Changes (Glicko-2)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pc-border text-pc-text-secondary text-left">
              <th className="pb-2 pr-4">Player</th>
              <th className="pb-2 pr-4">μ Before</th>
              <th className="pb-2 pr-4">μ After</th>
              <th className="pb-2 pr-4">Δμ</th>
              <th className="pb-2 pr-4">φ Before</th>
              <th className="pb-2">φ After</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s) => (
              <tr key={s.player_id} className="border-b border-pc-border/50 hover:bg-pc-bg-secondary transition-colors">
                <td className="py-2 pr-4 font-medium text-pc-text">{s.player_name}</td>
                <td className="py-2 pr-4 text-pc-text-secondary">{formatRating(s.mu_before)}</td>
                <td className="py-2 pr-4 text-pc-text-secondary">{formatRating(s.mu_after)}</td>
                <td className={`py-2 pr-4 font-semibold ${s.mu_change == null ? "text-pc-text-secondary" : s.mu_change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {formatChange(s.mu_change)}
                </td>
                <td className="py-2 pr-4 text-pc-text-secondary">{formatRating(s.phi_before)}</td>
                <td className="py-2 text-pc-text-secondary">{formatRating(s.phi_after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}