"use client";

import Link from "next/link";

interface MetricRow {
  key: string;
  label: string;
  color: string;
  p10: number;
  p25: number;
  mean: number;
  p75: number;
  p90: number;
}

const DETAIL_LINK_CLASS =
  "text-xs text-pc-text-secondary hover:text-pc-accent transition-colors drop-shadow-sm";

function formatMetric(key: string, value: number): string {
  if (key === "kda") return value.toFixed(1);
  return Math.round(value).toLocaleString();
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1000) return Math.round(value).toLocaleString();
  return value.toFixed(1);
}

export function PerformanceOverviewCard({
  metrics,
  dataset,
}: {
  metrics: MetricRow[];
  dataset: {
    matches: number;
    players: number;
    avgDuration: string;
    avgKda: string;
  };
}) {
  return (
    <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-5 hover:border-pc-accent-mid transition-colors space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-pc-text">Performance Overview</h2>
      </div>

      {/* Metric rows */}
      <div className="space-y-4">
        {metrics.map(({ key, label, color, p10, p25, mean, p75, p90 }) => (
          <div key={key} className="flex items-center gap-4">
            {/* Label column */}
            <div className="w-20 shrink-0 text-right">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-pc-text">{label}</span>
                <Link href={`/stats/${key}`} className={DETAIL_LINK_CLASS}>
                  →
                </Link>
              </div>
              <div className="text-sm font-bold mt-0.5 tabular-nums" style={{ color }}>
                {formatMetric(key, mean)}
              </div>
            </div>

            {/* Range bar */}
            <div className="flex-1">
              <RangeBar
                color={color}
                mean={mean}
                p10={p10}
                p25={p25}
                p75={p75}
                p90={p90}
              />
            </div>

            {/* Range endpoint labels */}
            <div className="w-14 shrink-0 text-[10px] text-pc-text-muted tabular-nums leading-tight">
              <div>{formatCompact(p10)}</div>
              <div className="text-pc-text-secondary mt-0.5">{formatCompact(p90)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Dataset summary bar */}
      <div className="border-t border-pc-border pt-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
          <span className="text-pc-text-muted font-semibold">Dataset</span>
          <span className="text-pc-text-secondary tabular-nums">
            {dataset.matches.toLocaleString()} matches
          </span>
          <span className="text-pc-text-secondary tabular-nums">
            {dataset.players.toLocaleString()} players
          </span>
          <span className="text-pc-text-secondary tabular-nums">
            Avg {dataset.avgDuration}
          </span>
          <span className="text-pc-text-secondary tabular-nums">
            KDA {dataset.avgKda}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Horizontal range bar ── */

function RangeBar({
  color,
  mean,
  p10,
  p25,
  p75,
  p90,
}: {
  color: string;
  mean: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
}) {
  const range = Math.max(1, p90 - p10);

  const toPct = (v: number) => Math.max(1, Math.min(99, ((v - p10) / range) * 100));
  const meanPct = toPct(mean);
  const p25Pct = toPct(p25);
  const p75Pct = toPct(p75);

  return (
    <div className="relative h-8">
      {/* Track — full p10→p90 range (subtle background) */}
      <div
        className="absolute inset-x-0 top-2 h-4 rounded-full"
        style={{ background: color, opacity: 0.1 }}
      />

      {/* IQR box — p25 to p75 (medium opacity solid block) */}
      <div
        className="absolute top-2 h-4 rounded-md"
        style={{
          left: `${p25Pct}%`,
          width: `${Math.max(2, p75Pct - p25Pct)}%`,
          background: color,
          opacity: 0.25,
        }}
      />

      {/* Mean marker — vertical line with glow */}
      <div
        className="absolute top-1 h-6 w-1.5 rounded-full"
        style={{
          left: `${meanPct}%`,
          background: color,
          boxShadow: `0 0 10px ${color}aa`,
          transform: "translateX(-50%)",
        }}
      />
    </div>
  );
}
