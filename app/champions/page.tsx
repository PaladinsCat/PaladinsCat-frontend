/**
 * Render the champions page and its data composition.
 * Assemble the page content exposed at this location.
 * refs: none
 */
import ChampionTable from "@/components/champion-table";
import { getInitialRankedChampions } from "@/lib/server-champions";

/**
 * Select dynamic rendering for champions page.
 * Return the framework rendering mode constant used by this page.
 * refs: none
 */
export const dynamic = "force-dynamic";

/**
 * Render the ChampionsPage view for champions page.
 * Return the React tree for the declared inputs and page data.
 * Returns: `Promise<React.JSX.Element>`
 * refs: none
 */
export default async function ChampionsPage() {
  const initialChampions = await getInitialRankedChampions().catch((error) => {
    console.error("[champions] Server overview fetch failed; using browser fallback", error);
    return null;
  });

  return (
    <div className="space-y-6">
      <ChampionTable initialChampions={initialChampions} />
    </div>
  );
}
