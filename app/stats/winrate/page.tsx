import ChampionRateDetailPage from "@/components/ChampionRateDetailPage";
import { getInitialRankedChampions } from "@/lib/server-champions";

const CONFIG = {
  key: "winRate" as const,
  labelKey: "common.sort.winRate",
  stroke: "var(--pc-chart-green)",
  fill: "rgba(52,211,153,0.16)",
} as const;

export const dynamic = "force-dynamic";

export default async function WinRatePage() {
  const initialChampions = await getInitialRankedChampions().catch((error) => {
    console.error("[stats/winrate] Server champion fetch failed; using browser fallback", error);
    return null;
  });

  return (
    <ChampionRateDetailPage config={CONFIG} initialChampions={initialChampions} />);
}
