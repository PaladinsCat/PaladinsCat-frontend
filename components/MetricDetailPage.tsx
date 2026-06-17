"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_GLOBAL_METRICS, MOCK_METRIC_BY_CLASS } from "@/lib/mock-data";
import { championSlug } from "@/lib/utils";
import { getChampionIconSafe } from "@/lib/champion-icons";

interface MetricConfig {
  key: string;
  label: string;
  unit: string;
  stroke: string;
  fill: string;
}

const CLASS_ICONS: Record<string, string> = {
  Frontline: "/images/icons/Class_Front_Line_Icon.avif",
  Damage: "/images/icons/Class_Damage_Icon.avif",
  Flank: "/images/icons/Class_Flank_Icon.avif",
  Support: "/images/icons/Class_Support_Icon.avif",
};

const CLASS_ORDER = ["Frontline", "Damage", "Flank", "Support"] as const;

type SortDir = "asc" | "desc";

export default function MetricDetailPage({ config }: { config: MetricConfig }) {
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const globalMetrics = MOCK_GLOBAL_METRICS;
  const d = globalMetrics[config.key as keyof typeof globalMetrics] as { min: number; max: number; mean: number; mode: number };
  const classData = MOCK_METRIC_BY_CLASS[config.key] || {};

  const range = d.max - d.min;
  const meanPct = (d.mean - d.min) / range;
  const modePct = (d.mode - d.min) / range;
  const isDecimal = config.key === "kda";
  const formatVal = isDecimal ? (v: number) => v.toFixed(1) : (v: number) => v.toLocaleString();

  // Bell curve
  const W = 280;
  const H = 60;
  const sigma = 0.18;
  const points: string[] = [];
  for (let i = 0; i <= W; i++) {
    const x = i / W;
    const g1 = Math.exp(-0.5 * ((x - meanPct) / sigma) ** 2);
    const g2 = Math.exp(-0.5 * ((x - modePct) / (sigma * 0.8)) ** 2);
    const y = 0.6 * g1 + 0.4 * g2;
    points.push(`${i},${H - y * (H - 4)}`);
  }
  const linePath = `M0,${H} L${points.join(" L")} L${W},${H} Z`;

  // Build full champion leaderboard (all classes combined)
  const allChampions = CLASS_ORDER.flatMap((cls) =>
    (classData[cls]?.champions || []).map((c) => ({
      ...c,
      className: cls,
      classAvg: classData[cls]?.avg || 0,
    }))
  );
  const sorted = [...allChampions].sort((a, b) =>
    sortDir === "desc" ? b.value - a.value : a.value - b.value
  );

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <Link href="/stats" className="text-pc-accent text-xs hover:underline mb-2 inline-block">← Global Stats</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{config.label}</h1>
        <p className="text-pc-text-secondary text-sm mt-1">
          Detailed breakdown by class and champion
        </p>
      </div>

      {/* ── Hero: Bell Curve + Stats ── */}
      <section className="bg-pc-bg-elevated border border-pc-border rounded-xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bell curve */}
          <div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32" preserveAspectRatio="none">
              <defs>
                <linearGradient id="hero-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={config.stroke} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={config.stroke} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={linePath} fill="url(#hero-grad)" />
              <path d={`M${points.join(" L")}`} fill="none" stroke={config.stroke} strokeWidth="2" strokeLinecap="round" />
              <line x1={meanPct * W} y1="0" x2={meanPct * W} y2={H} stroke={config.stroke} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
              <line x1={modePct * W} y1="4" x2={modePct * W} y2={H} stroke="#6a6a71" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
              <circle cx={meanPct * W} cy="2" r="3" fill={config.stroke} />
              <circle cx={modePct * W} cy="6" r="2.5" fill="#6a6a71" />
            </svg>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-[10px] text-pc-text-muted">
                <span className="w-2 h-2 rounded-full" style={{ background: config.stroke }} /> Mean
              </span>
              <span className="flex items-center gap-1 text-[10px] text-pc-text-muted">
                <span className="w-2 h-2 rounded-full bg-pc-text-muted" /> Mode
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Min", value: formatVal(d.min), color: "text-pc-text-secondary" },
              { label: "Mode", value: formatVal(d.mode), color: "text-pc-text-secondary" },
              { label: "Mean", value: formatVal(d.mean), color: config.stroke },
              { label: "Max", value: formatVal(d.max), color: "text-pc-text-secondary" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-pc-text-muted text-[10px] uppercase tracking-wider mb-1">{s.label}</div>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── By Class ── */}
      <section>
        <h2 className="text-lg font-bold text-pc-text mb-4">By Class</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CLASS_ORDER.map((cls) => {
            const cd = classData[cls];
            if (!cd) return null;
            return (
              <div key={cls} className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 hover:border-pc-accent-mid transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <img src={CLASS_ICONS[cls]} alt={cls} className="w-5 h-5" />
                  <h3 className="text-pc-text font-semibold text-sm">{cls}</h3>
                </div>
                <div className="flex items-center justify-between text-[10px] mb-3">
                  <span className="text-pc-text-muted">avg <span className="text-pc-text-secondary font-medium">{formatVal(cd.avg)}</span></span>
                  <span className="text-pc-text-muted">range <span className="text-pc-text-secondary">{formatVal(cd.min)}–{formatVal(cd.max)}</span></span>
                </div>
                <div className="space-y-1.5">
                  {cd.champions.map((c, i) => (
                    <Link key={c.name} href={`/champions/${championSlug(c.name)}`} className="flex items-center justify-between text-xs group">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-4 text-right shrink-0 ${i === 0 ? "text-yellow-400 font-bold" : "text-pc-text-muted"}`}>
                          {i + 1}
                        </span>
                        <span className="text-pc-text truncate group-hover:text-pc-accent transition-colors">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-pc-text-muted text-[10px]">{c.matches.toLocaleString()}</span>
                        <span className="font-medium" style={{ color: config.stroke }}>{formatVal(c.value)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Full Champion Leaderboard ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-pc-text">Champion Leaderboard</h2>
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="text-xs px-2.5 py-1 rounded-lg bg-pc-accent text-pc-bg"
          >
            {sortDir === "desc" ? "Highest First ↓" : "Lowest First ↑"}
          </button>
        </div>
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pc-border text-pc-text-muted text-left text-xs">
                <th className="px-3 py-3 w-8">#</th>
                <th className="px-3 py-3">Champion</th>
                <th className="px-3 py-3">Distribution</th>
                <th className="px-3 py-3 text-right">{config.label}</th>
                <th className="px-3 py-3 text-right">Matches</th>
                <th className="px-3 py-3 text-right">vs Avg</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const diff = c.value - d.mean;
                const diffPct = d.mean !== 0 ? ((diff / d.mean) * 100) : 0;
                const valPct = range > 0 ? Math.max(0, Math.min(100, ((c.value - d.min) / range) * 100)) : 50;
                return (
                  <tr key={c.name} className="border-b border-pc-border/50 hover:bg-pc-bg/50 transition-colors">
                    <td className="px-3 py-2 text-pc-text-muted text-xs">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={getChampionIconSafe(c.name)}
                          alt={c.name}
                          className="w-7 h-7 object-contain rounded shrink-0"
                        />
                        <div className="min-w-0">
                          <Link href={`/champions/${championSlug(c.name)}`} className="text-pc-text font-medium text-xs hover:text-pc-accent transition-colors block truncate">
                            {c.name}
                          </Link>
                          <span className="flex items-center gap-1 text-pc-text-muted text-[10px]">
                            <img src={CLASS_ICONS[c.className]} alt={c.className} className="w-3 h-3" />
                            {c.className}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {/* Mini distribution bar with labels */}
                      <div className="relative h-6 w-44">
                        {/* Track */}
                        <div className="absolute top-1 inset-x-0 h-2 rounded-full bg-pc-bg" />
                        {/* Fill to value */}
                        <div
                          className="absolute top-1 left-0 h-2 rounded-full opacity-30"
                          style={{ width: `${valPct}%`, background: config.stroke }}
                        />
                        {/* Mode marker */}
                        <div className="absolute top-0 bottom-3 w-px bg-pc-text-muted/40" style={{ left: `${modePct * 100}%` }} />
                        {/* Mean marker */}
                        <div className="absolute top-0 bottom-3 w-px" style={{ left: `${meanPct * 100}%`, background: config.stroke, opacity: 0.6 }} />
                        {/* Champion value dot */}
                        <div
                          className="absolute top-0.5 w-3 h-3 rounded-full border-2 border-pc-bg-elevated"
                          style={{ left: `${valPct}%`, transform: "translateX(-50%)", background: config.stroke }}
                        />
                        {/* Labels row */}
                        <div className="absolute bottom-0 inset-x-0 flex justify-between text-[8px] leading-none">
                          <span className="text-pc-text-muted/50">min</span>
                          <span style={{ color: config.stroke, opacity: 0.7 }}>mode</span>
                          <span style={{ color: config.stroke }}>mean</span>
                          <span className="text-pc-text-muted/50">max</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-xs" style={{ color: config.stroke }}>
                      {formatVal(c.value)}
                    </td>
                    <td className="px-3 py-2 text-right text-pc-text-secondary text-xs">
                      {c.matches.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      <span className={diff >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {diff >= 0 ? "+" : ""}{isDecimal ? diff.toFixed(1) : diff.toLocaleString()} ({diff >= 0 ? "+" : ""}{diffPct.toFixed(1)}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
