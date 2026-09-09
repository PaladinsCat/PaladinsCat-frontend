/** Render the full champion matchup directory within the statistics family.
 * refs: see: components/champion-table.tsx · endpoints: GET /champions/{id}/counters
 */
import ChampionTable from "@/components/champion-table";

/**
 * Render all 59 champions and route selections to matchup detail pages.
 */
export default function Page(): React.JSX.Element {
  return <ChampionTable relationshipDirectory />;
}
