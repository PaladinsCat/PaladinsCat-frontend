/** WinRateChart component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
"use client";

import { LineChartComponent } from "./Chart";
import type { PatchTrend } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

export interface WinRateChartProps {
  data: PatchTrend[];
  championName: string;
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * Returns: `React.JSX.Element`
 * refs: none
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
      colors={["var(--pc-chart-green)"]}
      showLegend={false}
    />
  );
}
