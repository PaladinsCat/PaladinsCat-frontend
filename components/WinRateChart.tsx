"use client";

import { LineChartComponent } from "./Chart";
import type { PatchTrend } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

export interface WinRateChartProps {
  data: PatchTrend[];
  championName: string;
}

export default function WinRateChart({ data, championName }: WinRateChartProps) {
  const { t } = useLocalization();
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
      title={t("generated.components.value1WinRateOverTime", { value1: championName })}
      height={250}
      colors={["#4ade80"]}
      showLegend={false}
    />
  );
}
