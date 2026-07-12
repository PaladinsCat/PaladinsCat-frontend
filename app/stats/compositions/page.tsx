"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchMatchCompositions, type MatchCompositionStat } from "@/lib/api-client";
import { useLobbyTier } from "@/lib/lobby-tier-context";

type SortKey = "totalMatches" | "winRate";

export default function CompositionStatsPage() {
  const [rows, setRows] = useState<MatchCompositionStat[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("totalMatches");
  const [descending, setDescending] = useState(true);
  const [loading, setLoading] = useState(true);
  const { definition: lobbyTier, ready: lobbyTierReady } = useLobbyTier();

  useEffect(() => {
    let cancelled = false;
    if (!lobbyTierReady) return;
    setLoading(true);
    fetchMatchCompositions({ tierMin: lobbyTier.tierMin, tierMax: lobbyTier.tierMax, limit: 200 })
      .then((data) => { if (!cancelled) setRows(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lobbyTier.tierMin, lobbyTier.tierMax, lobbyTierReady]);

  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return descending ? -diff : diff;
  }), [rows, sortKey, descending]);

  function changeSort(next: SortKey) {
    if (next === sortKey) setDescending((value) => !value);
    else {
      setSortKey(next);
      setDescending(true);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/stats" className="mb-2 inline-block text-xs text-pc-accent hover:underline">← Global Stats</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Composition Stats</h1>
        <p className="mt-1 text-sm text-pc-text-secondary">Ranked five-player team compositions. The order is Frontline · Damage · Flank · Support.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Compositions", rows.length.toLocaleString()],
          ["Most common", rows[0]?.composition ?? "—"],
          ["Tracked matches", rows.reduce((sum, row) => sum + row.totalMatches, 0).toLocaleString()],
          ["Best sampled WR", rows.length ? `${Math.max(...rows.filter((row) => row.totalMatches >= 20).map((row) => row.winRate), 0).toFixed(1)}%` : "—"],
        ].map(([label, value]) => <div key={label} className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4"><div className="text-[10px] uppercase tracking-wider text-pc-text-muted">{label}</div><div className="mt-1 truncate text-lg font-bold text-pc-text">{value}</div></div>)}
      </div>

      <div className="overflow-x-auto rounded-xl border border-pc-border bg-pc-bg-elevated">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-pc-border text-left text-xs text-pc-text-muted">
            <tr>
              <th className="px-4 py-3">Composition</th>
              <th className="px-3 py-3 text-right">Frontline</th>
              <th className="px-3 py-3 text-right">Damage</th>
              <th className="px-3 py-3 text-right">Flank</th>
              <th className="px-3 py-3 text-right">Support</th>
              <th className="px-3 py-3 text-right"><button onClick={() => changeSort("totalMatches")} className="hover:text-pc-accent">Matches {sortKey === "totalMatches" && (descending ? "↓" : "↑")}</button></th>
              <th className="px-3 py-3 text-right">W / L</th>
              <th className="px-4 py-3 text-right"><button onClick={() => changeSort("winRate")} className="hover:text-pc-accent">Win Rate {sortKey === "winRate" && (descending ? "↓" : "↑")}</button></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => <tr key={row.composition} className="border-b border-pc-border/50 transition-colors hover:bg-pc-bg-secondary/60">
              <td className="px-4 py-3 font-mono font-semibold text-pc-text">{row.composition}</td>
              <td className="px-3 py-3 text-right text-pc-text-secondary">{row.frontline}</td>
              <td className="px-3 py-3 text-right text-pc-text-secondary">{row.damage}</td>
              <td className="px-3 py-3 text-right text-pc-text-secondary">{row.flank}</td>
              <td className="px-3 py-3 text-right text-pc-text-secondary">{row.support}</td>
              <td className="px-3 py-3 text-right text-pc-text">{row.totalMatches.toLocaleString()}</td>
              <td className="px-3 py-3 text-right text-pc-text-secondary">{row.wins.toLocaleString()} / {row.losses.toLocaleString()}</td>
              <td className={row.winRate >= 50 ? "px-4 py-3 text-right font-semibold text-emerald-400" : "px-4 py-3 text-right font-semibold text-rose-400"}>{row.winRate.toFixed(1)}%</td>
            </tr>)}
            {sorted.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-pc-text-muted">{loading ? "Loading composition statistics…" : "Composition statistics are not available for this lobby scope yet."}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
