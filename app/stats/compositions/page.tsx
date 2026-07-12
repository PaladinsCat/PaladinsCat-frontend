"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchMatchCompositions, type MatchCompositionStat } from "@/lib/api-client";
import { useLobbyTier } from "@/lib/lobby-tier-context";

type SortKey = "totalMatches" | "winRate";

const CLASS_COLUMNS = [
  { key: "frontline", label: "Frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { key: "damage", label: "Damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { key: "flank", label: "Flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { key: "support", label: "Support", icon: "/images/icons/Class_Support_Icon.avif" },
] as const;

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
    <div className="mx-auto max-w-6xl space-y-6">
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

      <div className="flex flex-wrap items-center gap-2 md:hidden">
        <span className="text-xs text-pc-text-muted">Sort:</span>
        <button onClick={() => changeSort("totalMatches")} className={`pc-touch-target rounded-lg border px-3 text-xs ${sortKey === "totalMatches" ? "border-pc-accent bg-pc-accent/15 text-pc-accent" : "border-pc-border bg-pc-bg-elevated text-pc-text-secondary"}`}>Matches {sortKey === "totalMatches" && (descending ? "↓" : "↑")}</button>
        <button onClick={() => changeSort("winRate")} className={`pc-touch-target rounded-lg border px-3 text-xs ${sortKey === "winRate" ? "border-pc-accent bg-pc-accent/15 text-pc-accent" : "border-pc-border bg-pc-bg-elevated text-pc-text-secondary"}`}>Win rate {sortKey === "winRate" && (descending ? "↓" : "↑")}</button>
      </div>

      <div className="space-y-2 md:hidden">
        {sorted.map((row) => <article key={row.composition} className="pc-mobile-panel p-3">
          <div className="flex items-center justify-between gap-3"><div><div className="font-mono text-base font-bold text-pc-text">{row.composition}</div><div className="text-[10px] text-pc-text-muted">Frontline · Damage · Flank · Support</div></div><div className={row.winRate >= 50 ? "text-right font-bold text-emerald-400" : "text-right font-bold text-rose-400"}>{row.winRate.toFixed(1)}%<div className="text-[9px] font-normal uppercase tracking-wide text-pc-text-muted">win rate</div></div></div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">{CLASS_COLUMNS.map((column) => <div key={column.key} className="rounded-lg bg-pc-bg-secondary/60 p-2 text-center"><img src={column.icon} alt="" className="mx-auto h-5 w-5 object-contain" /><div className="mt-1 font-mono text-sm font-semibold text-pc-text">{row[column.key]}</div><div className="truncate text-[8px] uppercase text-pc-text-muted">{column.label}</div></div>)}</div>
          <div className="mt-3 flex items-center justify-between text-xs"><span className="text-pc-text-secondary">{row.totalMatches.toLocaleString()} matches</span><span className="text-pc-text-muted">{row.wins.toLocaleString()}W / {row.losses.toLocaleString()}L</span></div>
        </article>)}
        {sorted.length === 0 && <div className="pc-mobile-panel p-6 text-center text-sm text-pc-text-muted">{loading ? "Loading composition statistics…" : "Composition statistics are not available for this lobby scope yet."}</div>}
      </div>

      <div className="mx-auto hidden w-full max-w-5xl overflow-x-auto rounded-xl border border-pc-border bg-pc-bg-elevated shadow-lg shadow-black/10 md:block">
        <table className="w-full min-w-[760px] table-fixed text-sm">
          <thead className="border-b border-pc-border text-left text-xs text-pc-text-muted">
            <tr>
              <th className="w-[18%] px-4 py-3">Composition</th>
              {CLASS_COLUMNS.map((column) => <th key={column.key} className="w-[10%] px-2 py-3 text-right">
                <span className="inline-flex items-center justify-end gap-1.5">
                  <img src={column.icon} alt="" aria-hidden="true" className="h-4 w-4 object-contain" />
                  <span>{column.label}</span>
                </span>
              </th>)}
              <th className="px-3 py-3 text-right"><button onClick={() => changeSort("totalMatches")} className="hover:text-pc-accent">Matches {sortKey === "totalMatches" && (descending ? "↓" : "↑")}</button></th>
              <th className="px-3 py-3 text-right">W / L</th>
              <th className="px-4 py-3 text-right"><button onClick={() => changeSort("winRate")} className="hover:text-pc-accent">Win Rate {sortKey === "winRate" && (descending ? "↓" : "↑")}</button></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => <tr key={row.composition} className="border-b border-pc-border/50 transition-colors hover:bg-pc-bg-secondary/60">
              <td className="px-4 py-3 font-mono font-semibold text-pc-text">{row.composition}</td>
              {CLASS_COLUMNS.map((column) => <td key={column.key} className="px-2 py-3 text-right text-pc-text-secondary">
                <span className="inline-flex items-center justify-end gap-1.5 tabular-nums">
                  <img src={column.icon} alt="" aria-hidden="true" className="h-4 w-4 object-contain opacity-90" />
                  <span>{row[column.key]}</span>
                </span>
              </td>)}
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
