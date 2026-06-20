"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface BellCurveChartProps {
  mean: number;
  mode: number;
  p10: number;
  p90: number;
  stroke: string;
  height?: number;
}

function generateBellData(meanPct: number, modePct: number, sigma = 0.18) {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= 100; i++) {
    const x = i / 100;
    const g1 = Math.exp(-0.5 * ((x - meanPct) / sigma) ** 2);
    const g2 = Math.exp(-0.5 * ((x - modePct) / (sigma * 0.8)) ** 2);
    const y = 0.6 * g1 + 0.4 * g2;
    points.push({ x: i, y: Math.round(y * 1000) / 1000 });
  }
  return points;
}

export function BellCurveChart({
  mean,
  mode,
  p10,
  p90,
  stroke,
  height = 110,
}: BellCurveChartProps) {
  const range = Math.max(1, p90 - p10);
  const meanPct = (mean - p10) / range;
  const modePct = (mode - p10) / range;

  // Clamp to valid range
  const clampedMean = Math.max(0, Math.min(1, meanPct));
  const clampedMode = Math.max(0, Math.min(1, modePct));

  const data = generateBellData(clampedMean, clampedMode);
  const gradientId = `bell-grad-${stroke.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis dataKey="x" hide />
        <YAxis hide domain={[0, "auto"]} />
        <Tooltip
          content={() => null}
          cursor={false}
        />
        <ReferenceLine
          x={Math.round(clampedMean * 100)}
          stroke={stroke}
          strokeDasharray="4 3"
          strokeWidth={1.5}
          strokeOpacity={0.6}
        />
        {clampedMode !== clampedMean && (
          <ReferenceLine
            x={Math.round(clampedMode * 100)}
            stroke="#6a6a71"
            strokeDasharray="2 3"
            strokeWidth={1}
            strokeOpacity={0.5}
          />
        )}
        <Area
          type="monotone"
          dataKey="y"
          stroke={stroke}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
