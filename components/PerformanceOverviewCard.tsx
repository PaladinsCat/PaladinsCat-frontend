/** PerformanceOverviewCard component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
"use client";

import { useLocalization } from "@/lib/localization-context";
import {
  ECPM_ACTIVITY_THRESHOLDS,
  ecpmActivityScaleMax,
  type EcpmActivityLabelKey,
} from "@/lib/ecpm-activity";

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

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * refs: none
 */
export function PerformanceOverviewCard({
  metrics,
}: {
  metrics: MetricRow[];
}) {
  const { t, formatNumber } = useLocalization();
  const formatMetric = (key: string, value: number) => formatNumber(value, key === "kda"
    ? { minimumFractionDigits: 1, maximumFractionDigits: 1 }
    : { maximumFractionDigits: 0 });
  const formatCompact = (value: number) => {
    if (Math.abs(value) >= 1000) return formatNumber(value, { maximumFractionDigits: 0 });
    return formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };
  const isEcpmDistribution = metrics.length > 0 && metrics.every(({ key }) => key.startsWith("egpm-"));
  const ecpmScaleMax = isEcpmDistribution
    ? ecpmActivityScaleMax(metrics.flatMap(({ p90, mean }) => [p90, mean]))
    : null;
  const ecpmLegend = [
    { value: 120, labelKey: "generated.stats.egpm.engaged" as EcpmActivityLabelKey, color: "bg-emerald-400" },
    { value: 115, labelKey: "common.activity.possibleDisconnect" as EcpmActivityLabelKey, color: "bg-yellow-300" },
    { value: 100, labelKey: "generated.stats.egpm.disconnected" as EcpmActivityLabelKey, color: "bg-yellow-400" },
    { value: 80, labelKey: "generated.stats.egpm.partialAfk" as EcpmActivityLabelKey, color: "bg-orange-400" },
    { value: 60, labelKey: "generated.stats.egpm.fullAfk" as EcpmActivityLabelKey, color: "bg-red-400" },
  ];
  return (
    <div className="h-full bg-pc-bg-elevated border border-pc-border rounded-xl p-4">
      {isEcpmDistribution && <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 border-b border-pc-border/50 pb-2">
        {ecpmLegend.map(({ value, labelKey, color }) => {
          return <span key={labelKey} className="inline-flex items-center gap-1 text-xs text-pc-text-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
            <span>{t(labelKey)}</span>
          </span>;
        })}
      </div>}
      <div className="space-y-2">
        {metrics.map(({ key, label, color, p10, p25, mean, p75, p90 }) => (
          <div key={key} className="flex items-center gap-3">
            <div className="w-14 shrink-0 text-right">
              <span className="text-xs font-bold text-pc-text">{label}</span>
              <div className="text-xs font-bold tabular-nums" style={{ color }}>
                {formatMetric(key, mean)}
              </div>
            </div>
            <div className="flex-1">
              <RangeBar
                color={color}
                mean={mean}
                p10={p10}
                p25={p25}
                p75={p75}
                p90={p90}
                ecpmScaleMax={ecpmScaleMax}
              />
            </div>
            <div className="w-12 shrink-0 text-xs text-pc-text-muted tabular-nums leading-tight">
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
  ecpmScaleMax,
}: {
  color: string;
  mean: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  ecpmScaleMax: number | null;
}) {
  const { t } = useLocalization();
  const domainMin = ecpmScaleMax == null ? p10 : 0;
  const domainMax = ecpmScaleMax ?? p90;
  const range = Math.max(1, domainMax - domainMin);
  const toPct = (v: number) => Math.max(0, Math.min(100, ((v - domainMin) / range) * 100));
  const p10Pct = toPct(p10);
  const meanPct = toPct(mean);
  const p25Pct = toPct(p25);
  const p75Pct = toPct(p75);
  const p90Pct = toPct(p90);
  const activityBands = ecpmScaleMax == null ? [] : [
    { start: 0, end: ECPM_ACTIVITY_THRESHOLDS.fullAfk, color: "rgba(248, 113, 113, 0.24)", label: t("generated.stats.egpm.fullAfk") },
    { start: ECPM_ACTIVITY_THRESHOLDS.fullAfk, end: ECPM_ACTIVITY_THRESHOLDS.partialAfk, color: "rgba(251, 146, 60, 0.20)", label: t("generated.stats.egpm.partialAfk") },
    { start: ECPM_ACTIVITY_THRESHOLDS.partialAfk, end: ECPM_ACTIVITY_THRESHOLDS.disconnected, color: "rgba(250, 204, 21, 0.18)", label: t("generated.stats.egpm.disconnected") },
    { start: ECPM_ACTIVITY_THRESHOLDS.disconnected, end: ECPM_ACTIVITY_THRESHOLDS.engaged, color: "rgba(253, 224, 71, 0.12)", label: t("common.activity.possibleDisconnect") },
    { start: ECPM_ACTIVITY_THRESHOLDS.engaged, end: ecpmScaleMax, color: "rgba(52, 211, 153, 0.08)", label: t("generated.stats.egpm.engaged") },
  ];

  return (
    <div className="relative h-6">
      {/* Track — eCPM uses a fixed zero-based scale so AFK values cannot look healthy. */}
      <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-sm bg-pc-text-muted/10">
        {activityBands.map((band) => <div
          key={band.label}
          className="absolute inset-y-0"
          title={band.label}
          style={{ left: `${toPct(band.start)}%`, width: `${toPct(band.end) - toPct(band.start)}%`, background: band.color }}
        />)}
      </div>

      {ecpmScaleMax != null && [
        ECPM_ACTIVITY_THRESHOLDS.fullAfk,
        ECPM_ACTIVITY_THRESHOLDS.partialAfk,
        ECPM_ACTIVITY_THRESHOLDS.disconnected,
        ECPM_ACTIVITY_THRESHOLDS.engaged,
      ].map((threshold) => <div
        key={threshold}
        className="absolute inset-y-0 w-px bg-pc-text/25"
        style={{ left: `${toPct(threshold)}%` }}
        title={String(threshold)}
      />)}

      {/* Whisker line — p10 to p25 and p75 to p90 */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full"
        style={{
          left: `${p10Pct}%`,
          width: `${Math.max(0, p25Pct - p10Pct)}%`,
          background: color,
          opacity: 0.3,
        }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full"
        style={{
          left: `${p75Pct}%`,
          width: `${Math.max(0, p90Pct - p75Pct)}%`,
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
