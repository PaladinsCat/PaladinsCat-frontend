/** performance-range-bell-curve component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
import type { PerformanceMetricSummary } from "@/lib/api-client";

type Labels = {
  global: string;
  range: string;
  mode: string;
  median: string;
  mean: string;
  p10: string;
  p90: string;
  percentileRange: string;
};

type Props = {
  metricLabel: string;
  summary: PerformanceMetricSummary;
  formatValue: (value: number) => string;
  labels: Labels;
};

const VIEWBOX_WIDTH = 720;
const VIEWBOX_HEIGHT = 132;
const PLOT_LEFT = 20;
const PLOT_RIGHT = 700;
const PLOT_TOP = 12;
const PLOT_BOTTOM = 104;

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

/** A compact normal-distribution approximation anchored to the observed P10/P90 range.  Returns: `React.JSX.Element`. · refs: none */
export default function PerformanceRangeBellCurve({ metricLabel, summary, formatValue, labels }: Props) {
  const p10 = finite(summary.p10);
  const p90 = Math.max(p10, finite(summary.p90));
  const mean = finite(summary.mean);
  const mode = finite(summary.mode, mean) || mean;
  const median = finite(summary.median, mean) || mean;
  const spread = Math.max(p90 - p10, Math.abs(mean) * 0.1, 1);
  const domainStart = Math.max(0, Math.min(p10, mode, median, mean) - spread * 0.55);
  const domainEnd = Math.max(domainStart + 1, Math.max(p90, mode, median, mean) + spread * 0.55);
  const sigma = Math.max((p90 - p10) / (2 * 1.28155), spread / 4);
  const plotWidth = PLOT_RIGHT - PLOT_LEFT;
  const plotHeight = PLOT_BOTTOM - PLOT_TOP;
  const xFor = (value: number) => PLOT_LEFT + ((Math.min(domainEnd, Math.max(domainStart, value)) - domainStart) / (domainEnd - domainStart)) * plotWidth;
  const yFor = (value: number) => PLOT_BOTTOM - Math.exp(-0.5 * ((value - mode) / sigma) ** 2) * plotHeight;
  const curvePoints = Array.from({ length: 49 }, (_, index) => {
    const value = domainStart + (index / 48) * (domainEnd - domainStart);
    return `${index === 0 ? "M" : "L"}${xFor(value).toFixed(2)},${yFor(value).toFixed(2)}`;
  }).join(" ");
  const areaPath = `${curvePoints} L${PLOT_RIGHT},${PLOT_BOTTOM} L${PLOT_LEFT},${PLOT_BOTTOM} Z`;
  const p10X = xFor(p10);
  const p90X = xFor(p90);
  const modeX = xFor(mode);
  const meanX = xFor(mean);
  const medianX = xFor(median);
  const summaryLabel = `${labels.global} ${metricLabel} ${labels.range}: ${labels.p10} ${formatValue(p10)}, ${labels.mode} ${formatValue(mode)}, ${labels.median} ${formatValue(median)}, ${labels.mean} ${formatValue(mean)}, ${labels.p90} ${formatValue(p90)}.`;

  return (
    <section className="rounded-xl border border-pc-border bg-pc-bg-elevated px-4 py-3" aria-labelledby="performance-range-title">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="performance-range-title" className="text-sm font-semibold text-pc-text">{labels.global} {metricLabel} {labels.range}</h2>
        <span className="text-xs text-pc-text-muted">{labels.percentileRange}</span>
      </div>
      <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="h-32 w-full" role="img" aria-label={summaryLabel}>
        <title>{summaryLabel}</title>
        <rect x={p10X} y={PLOT_TOP} width={Math.max(1, p90X - p10X)} height={plotHeight} className="fill-pc-accent/10" />
        <path d={areaPath} className="fill-pc-accent/15" />
        <path d={curvePoints} fill="none" className="stroke-pc-accent" strokeWidth="2.5" />
        <line x1={PLOT_LEFT} y1={PLOT_BOTTOM} x2={PLOT_RIGHT} y2={PLOT_BOTTOM} className="stroke-pc-border" strokeWidth="1" />
        <line x1={p10X} y1={PLOT_TOP} x2={p10X} y2={PLOT_BOTTOM} className="stroke-pc-text-muted" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={p90X} y1={PLOT_TOP} x2={p90X} y2={PLOT_BOTTOM} className="stroke-pc-text-muted" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={meanX} y1={PLOT_TOP + 8} x2={meanX} y2={PLOT_BOTTOM} className="stroke-pc-accent" strokeWidth="2" />
        <circle cx={meanX} cy={yFor(mean)} r="4" className="fill-pc-accent" />
        <line x1={modeX} y1={PLOT_TOP + 18} x2={modeX} y2={PLOT_BOTTOM} className="stroke-pc-text" strokeWidth="1.5" />
        <circle cx={modeX} cy={yFor(mode)} r="3" className="fill-pc-text" />
        <line x1={medianX} y1={PLOT_TOP + 18} x2={medianX} y2={PLOT_BOTTOM} className="stroke-pc-text" strokeWidth="1.5" />
        <circle cx={medianX} cy={yFor(median)} r="3" className="fill-pc-text" />
        <text x={PLOT_LEFT} y="124" className="fill-pc-text-muted text-xs">{formatValue(domainStart)}</text>
        <text x={PLOT_RIGHT} y="124" textAnchor="end" className="fill-pc-text-muted text-xs">{formatValue(domainEnd)}</text>
      </svg>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-5">
        {[
          [labels.p10, p10],
          [labels.mode, mode],
          [labels.median, median],
          [labels.mean, mean],
          [labels.p90, p90],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex items-baseline justify-between gap-2 sm:block">
            <dt className="text-pc-text-muted">{label}</dt>
            <dd className="font-mono font-semibold tabular-nums text-pc-text">{formatValue(Number(value))}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
