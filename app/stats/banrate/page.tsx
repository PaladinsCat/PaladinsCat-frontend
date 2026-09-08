/**
 * Render champion ban-rate statistics with a server-fetched initial champion set. · refs: none
 * refs: none
 */
import ChampionRateDetailPage from "@/components/ChampionRateDetailPage";
import { getInitialRankedChampions } from "@/lib/server-champions";

const CONFIG = {
  key: "banRate" as const,
  labelKey: "common.metrics.banRate",
} as const;

/**
 * Selects request-fresh rendering for statistics data.
 * Returns: `Promise<React.JSX.Element>`
 * refs: none
 */
export const dynamic = "force-dynamic";

/**
 * Render champion ban-rate statistics with a server-fetched initial champion set. · refs: none
 * I/O types: `none -> Promise<JSX.Element>`.
 */
export default async function BanRatePage() {
  const initialChampions = await getInitialRankedChampions().catch((error) => {
    console.error("[stats/banrate] Server champion fetch failed; using browser fallback", error);
    return null;
  });

  return (
    <ChampionRateDetailPage config={CONFIG} initialChampions={initialChampions} />);
}
