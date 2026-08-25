import ChampionRateDetailPage from "@/components/ChampionRateDetailPage";
import { getInitialRankedChampions } from "@/lib/server-champions";

const CONFIG = {
  key: "banRate" as const,
  labelKey: "common.metrics.banRate",
  stroke: "var(--pc-chart-red)",
  fill: "rgba(251,113,133,0.16)",
} as const;

export const dynamic = "force-dynamic";

export default async function BanRatePage() {
  const initialChampions = await getInitialRankedChampions().catch((error) => {
    console.error("[stats/banrate] Server champion fetch failed; using browser fallback", error);
    return null;
  });

  return (
    <ChampionRateDetailPage config={CONFIG} initialChampions={initialChampions} />);
}
