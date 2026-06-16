"use client";

import { LineChartComponent } from "./Chart";
import type { PatchTrend } from "@/lib/api-client";

export interface WinRateChartProps {
  data: PatchTrend[];
  championName: string;
}

export default function WinRateChart({ data, championName }: WinRateChartProps) {
  const chartData = data.map((d) => ({
    week: d.trendWeek,
    winRate: d.weeklyWinRate,
  }));

  return (
    <LineChartComponent
      data={chartData}
      xKey="week"
      yKeys={["winRate"]}
      yLabel="Win Rate (%)"
      title={`${championName} — Win Rate Over Time`}
      height={250}
      colors={["#4ade80"]}
      showLegend={false}
    />
  );
}
