/**
 * Render champion win-rate statistics with server-provided initial rankings. · refs: none
 * refs: none
 */
import ChampionRateDetailPage from "@/components/ChampionRateDetailPage";
import { getInitialRankedChampions } from "@/lib/server-champions";

const CONFIG = {
  key: "winRate" as const,
  labelKey: "common.sort.winRate",
} as const;

/**
 * Selects request-fresh rendering for statistics data.
 * Returns: `Promise<React.JSX.Element>`
 * refs: none
 */
export const dynamic = "force-dynamic";

/**
 * Render champion win-rate statistics with server-provided initial rankings. · refs: none
 * I/O types: `none -> Promise<JSX.Element>`.
 */
export default async function WinRatePage() {
  const initialChampions = await getInitialRankedChampions().catch((error) => {
    console.error("[stats/winrate] Server champion fetch failed; using browser fallback", error);
    return null;
  });

  return (
    <ChampionRateDetailPage config={CONFIG} initialChampions={initialChampions} enableScopeSelection />);
}
