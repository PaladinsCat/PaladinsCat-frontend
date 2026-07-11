"use client";

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

function formatMetric(key: string, value: number): string {
  if (key === "kda") return value.toFixed(1);
  return Math.round(value).toLocaleString();
}

export function PerformanceOverviewCard({
  metrics,
}: {
  metrics: MetricRow[];
}) {
  const formatCompact = (value: number) => {
    if (Math.abs(value) >= 1000) return Math.round(value).toLocaleString();
    return value.toFixed(1);
  };
  return (
    <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4">
      <div className="space-y-2">
        {metrics.map(({ key, label, color, p10, p25, mean, p75, p90 }) => (
          <div key={key} className="flex items-center gap-3">
            <div className="w-14 shrink-0 text-right">
              <span className="text-[10px] font-bold text-pc-text">{label}</span>
              <div className="text-xs font-bold tabular-nums" style={{ color }}>
                {formatMetric(key, mean)}
              </div>
            </div>
            <div className="flex-1">
              <RangeBar color={color} mean={mean} p10={p10} p25={p25} p75={p75} p90={p90} />
            </div>
            <div className="w-12 shrink-0 text-[9px] text-pc-text-muted tabular-nums leading-tight">
              <div>{formatCompact(p10)}</div>
              <div className="text-pc-text-secondary">{formatCompact(p90)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Range bar: IQR box with mean marker ── */

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
    <div className="relative h-6">
      {/* Track — full range background */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-pc-text-muted/10" />

      {/* Whisker line — p10 to p25 and p75 to p90 */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full"
        style={{
          left: "0%",
          width: `${p25Pct}%`,
          background: color,
          opacity: 0.3,
        }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full"
        style={{
          left: `${p75Pct}%`,
          width: `${100 - p75Pct}%`,
          background: color,
          opacity: 0.3,
        }}
      />

      {/* IQR box — p25 to p75 (solid block) */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-3 rounded-sm"
        style={{
          left: `${p25Pct}%`,
          width: `${Math.max(4, p75Pct - p25Pct)}%`,
          background: color,
          opacity: 0.35,
        }}
      />

      {/* Mean marker — bold vertical line */}
      <div
        className="absolute top-0 h-full w-[2px] rounded-full"
        style={{
          left: `${meanPct}%`,
          background: color,
          transform: "translateX(-50%)",
          boxShadow: `0 0 8px ${color}88`,
        }}
      />
    </div>
  );
}
