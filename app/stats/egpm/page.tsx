"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PerformanceOverviewCard } from "@/components/PerformanceOverviewCard";
import { ContentFade, EmptyState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { fetchBaselines, type BaselineEntry } from "@/lib/api-client";
import { useLobbyTier } from "@/lib/lobby-tier-context";
import { LOBBY_TIER_OPTIONS, type LobbyTierFilter } from "@/lib/lobby-tier";

const ROLE_ORDER = ["Global", "Damage", "Flank", "Support", "Frontline"];
const ROLE_COLORS: Record<string, string> = {
  Global: "#facc15",
  Damage: "#f87171",
  Flank: "#c084fc",
  Support: "#34d399",
  Frontline: "#60a5fa",
};

function format(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function EgpmDetailPage() {
  const { filter, definition: lobbyTier, ready, setFilter } = useLobbyTier();
  const [rows, setRows] = useState<BaselineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"role" | "average" | "samples">("role");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    fetchBaselines({ queueId: 486, tierMin: lobbyTier.tierMin, tierMax: lobbyTier.tierMax })
      .then((next) => { if (!cancelled) setRows(next); })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lobbyTier.label, lobbyTier.tierMax, lobbyTier.tierMin, ready]);

  const ordered = useMemo(() => [...rows].sort((a, b) => {
    if (sort === "average") return b.avgEgpm - a.avgEgpm;
    if (sort === "samples") return b.sampleSize - a.sampleSize;
    return ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
  }), [rows, sort]);
  const global = rows.find((row) => row.role === "Global") ?? null;

  if (loading) return <RouteSkeleton variant="dashboard" />;

  return (
    <div className="space-y-7">
      <header>
        <Link href="/stats" className="text-sm text-pc-text-secondary transition-colors hover:text-pc-accent">← Global Stats</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="pc-heading pc-heading-lg text-pc-accent">Effective Credits per Minute</h1>
            <p className="mt-1 max-w-3xl text-sm text-pc-text-secondary">eGPM measures credits earned through participation after removing the 500 starting credits.</p>
          </div>
          <label className="rounded-lg border border-pc-accent-mid/50 bg-pc-bg-elevated px-3 py-2">
            <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-pc-text-muted">Lobby tier</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value as LobbyTierFilter)} className="bg-transparent text-xs font-semibold text-pc-accent outline-none">
              {LOBBY_TIER_OPTIONS.map((option) => <option key={option.value} value={option.value} className="bg-pc-bg-elevated text-pc-text">{option.label}</option>)}
            </select>
          </label>
        </div>
      </header>

      {rows.length === 0 ? <EmptyState title="No eGPM baselines" description="No complete ranked observations match this lobby-tier scope." /> : <>
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div><h2 className="text-sm font-bold text-pc-text">Current player-base distribution</h2><p className="mt-1 text-xs text-pc-text-muted">Whiskers show P10–P90, the box shows P25–P75, and the marker is the average.</p></div>
            <span className="text-xs text-pc-text-secondary">{global?.sampleSize.toLocaleString() ?? "—"} global player-match observations</span>
          </div>
          <ContentFade><PerformanceOverviewCard metrics={ROLE_ORDER.map((role) => rows.find((row) => row.role === role)).filter((row): row is BaselineEntry => Boolean(row)).map((row) => ({
            key: `egpm-${row.role}`,
            label: row.role === "Frontline" ? "Front" : row.role === "Support" ? "Supp" : row.role === "Damage" ? "Dmg" : row.role,
            color: ROLE_COLORS[row.role] ?? "#facc15",
            p10: row.p10Egpm,
            p25: row.p25Egpm,
            mean: row.avgEgpm,
            p75: row.p75Egpm,
            p90: row.p90Egpm,
          }))} /></ContentFade>
        </section>

        {global && <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Average", global.avgEgpm], ["P10", global.p10Egpm], ["P25", global.p25Egpm],
            ["P75", global.p75Egpm], ["P90", global.p90Egpm], ["Maximum", global.maxEgpm],
          ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4"><div className="text-[10px] uppercase tracking-wider text-pc-text-muted">Global {label}</div><div className="mt-1 text-xl font-bold text-yellow-400 tabular-nums">{format(Number(value))}</div></div>)}
        </section>}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="pc-card">
            <h2 className="pc-card-title">Calculation</h2>
            <div className="mt-3 rounded-lg border border-pc-border bg-pc-bg px-4 py-3 font-mono text-sm text-pc-accent">eGPM = (Gold earned − 500) ÷ minutes played</div>
            <p className="mt-3 text-sm leading-relaxed text-pc-text-secondary">Starting credits are removed so the metric reflects active credit generation. Longer participation, eliminations, objective play, and other credit-producing actions raise eGPM. Only complete ranked match facts with valid players and more than two minutes played enter these baselines.</p>
          </div>
          <div className="pc-card">
            <h2 className="pc-card-title">AFK severity thresholds</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              {[
                ["Engaged", "≥ 80", "text-emerald-400"], ["Disconnected", "60–79", "text-yellow-400"],
                ["Partial AFK", "40–59", "text-orange-400"], ["Full AFK", "< 40", "text-red-400"],
              ].map(([label, range, color]) => <div key={label} className="rounded-lg border border-pc-border bg-pc-bg p-3"><div className={`font-semibold ${color}`}>{label}</div><div className="mt-1 font-mono text-pc-text-secondary">{range} eGPM</div></div>)}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-pc-text-muted">These are fixed detection thresholds. The role and global percentiles describe the current player base; changing the global lobby-tier selection recalculates this page for that tier range.</p>
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-pc-text">Role percentile values</h2>
            <div className="flex gap-1 rounded-lg border border-pc-border bg-pc-bg-elevated p-1 text-xs">
              {(["role", "average", "samples"] as const).map((key) => <button key={key} type="button" onClick={() => setSort(key)} className={`rounded-md px-2.5 py-1.5 capitalize transition-colors ${sort === key ? "bg-pc-accent text-pc-bg" : "text-pc-text-secondary hover:text-pc-text"}`}>{key}</button>)}
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-pc-border bg-pc-bg-elevated">
            <table className="w-full min-w-[760px] text-sm tabular-nums">
              <thead><tr className="border-b border-pc-border text-left text-[10px] uppercase tracking-wider text-pc-text-muted"><th className="px-4 py-3">Role</th><th className="px-3 py-3 text-right">Average</th><th className="px-3 py-3 text-right">P10</th><th className="px-3 py-3 text-right">P25</th><th className="px-3 py-3 text-right">P75</th><th className="px-3 py-3 text-right">P90</th><th className="px-3 py-3 text-right">Max</th><th className="px-4 py-3 text-right">Samples</th></tr></thead>
              <tbody>{ordered.map((row) => <tr key={row.role} className="border-b border-pc-border/50 last:border-b-0"><th className="px-4 py-3 text-left font-semibold" style={{ color: ROLE_COLORS[row.role] }}>{row.role}</th><td className="px-3 py-3 text-right font-bold text-pc-text">{format(row.avgEgpm)}</td><td className="px-3 py-3 text-right text-pc-text-secondary">{format(row.p10Egpm)}</td><td className="px-3 py-3 text-right text-pc-text-secondary">{format(row.p25Egpm)}</td><td className="px-3 py-3 text-right text-pc-text-secondary">{format(row.p75Egpm)}</td><td className="px-3 py-3 text-right text-pc-text-secondary">{format(row.p90Egpm)}</td><td className="px-3 py-3 text-right text-pc-text-secondary">{format(row.maxEgpm)}</td><td className="px-4 py-3 text-right text-pc-text-muted">{row.sampleSize.toLocaleString()}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </>}
    </div>
  );
}
