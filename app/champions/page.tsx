/**
 * Render the champions page and its data composition.
 * Assemble the page content exposed at this location.
 */
import ChampionTable from "@/components/champion-table";
import { getInitialRankedChampions } from "@/lib/server-champions";

/**
 * Select dynamic rendering for champions page.
 * Return the framework rendering mode constant used by this page.
 */
export const dynamic = "force-dynamic";

/**
 * Render the ChampionsPage view for champions page.
 * Return the React tree for the declared inputs and page data.
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
