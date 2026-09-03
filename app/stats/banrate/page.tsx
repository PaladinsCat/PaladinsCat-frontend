/**
 * Define the stats banrate page route boundary.
 * Coordinates this module's route data flow and rendered output.
 * refs: none
 */
import ChampionRateDetailPage from "@/components/ChampionRateDetailPage";
import { getInitialRankedChampions } from "@/lib/server-champions";

const CONFIG = {
  key: "banRate" as const,
  labelKey: "common.metrics.banRate",
  stroke: "var(--pc-chart-red)",
  fill: "rgba(251,113,133,0.16)",
} as const;

/**
 * Selects request-fresh rendering for statistics data.
 * Returns: `Promise<React.JSX.Element>`
 * refs: none
 */
export const dynamic = "force-dynamic";

/** Render champion ban-rate statistics with a server-fetched initial champion set. · refs: none */
export default async function BanRatePage() {
  const initialChampions = await getInitialRankedChampions().catch((error) => {
    console.error("[stats/banrate] Server champion fetch failed; using browser fallback", error);
    return null;
  });

  return (
    <ChampionRateDetailPage config={CONFIG} initialChampions={initialChampions} />);
}
