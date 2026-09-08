/**
 * Render win rate chart with `LineChartComponent`.
 * refs: none
 */
"use client";

import { LineChartComponent } from "./Chart";
import type { PatchTrend } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

/**
 * Describe win rate chart props with data, championName.
 * refs: none
 */
export interface WinRateChartProps {
  data: PatchTrend[];
  championName: string;
}

/**
 * Render win rate chart with `LineChartComponent`.
 * refs: none
 * I/O types: `{ data, championName }: WinRateChartProps -> JSX.Element`.
 */
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
      yLabel={t("generated.leaderboard.winRate")}
      title={t("generated.components.value1WinRateOverTime", { value1: championName })}
      height={250}
      percentageScale
      showLegend={false}
    />
  );
}
