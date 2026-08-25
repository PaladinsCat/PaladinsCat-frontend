import ChampionTable from "@/components/champion-table";
import { getInitialRankedChampions } from "@/lib/server-champions";

export const dynamic = "force-dynamic";

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
