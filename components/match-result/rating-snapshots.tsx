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
      <div className="space-y-2 sm:hidden">
        {snapshots.map((snapshot) => <article key={snapshot.player_id} className="rounded-xl border border-pc-border bg-pc-bg-secondary/50 p-3">
          <div className="flex min-w-0 items-center justify-between gap-3"><div className="truncate text-sm font-semibold text-pc-text">{snapshot.player_name}</div><span className={`shrink-0 font-mono text-sm font-bold ${snapshot.mu_change == null ? "text-pc-text-secondary" : snapshot.mu_change >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatChange(snapshot.mu_change)}</span></div>
          <dl className="mt-3 grid grid-cols-2 gap-2"><div><dt className="text-[9px] uppercase text-pc-text-muted">Rating μ</dt><dd className="font-mono text-xs text-pc-text-secondary">{formatRating(snapshot.mu_before)} → {formatRating(snapshot.mu_after)}</dd></div><div><dt className="text-[9px] uppercase text-pc-text-muted">Deviation φ</dt><dd className="font-mono text-xs text-pc-text-secondary">{formatRating(snapshot.phi_before)} → {formatRating(snapshot.phi_after)}</dd></div></dl>
        </article>)}
      </div>
      <div className="hidden overflow-x-auto sm:block">
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
