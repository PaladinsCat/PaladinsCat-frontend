import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { championSlug } from "@/lib/utils";
import ChampionDetailPageClient, { type ChampionPagePayload } from "./champion-detail-client";

const SERVER_API_BASE = process.env.NEXT_SERVER_API_URL || "http://localhost:3304";

export const dynamic = "force-dynamic";

async function getInitialChampionPageData(name: string): Promise<ChampionPagePayload | null> {
  const champion = STATIC_CHAMPIONS.find((entry) => championSlug(entry.name) === name.toLowerCase());
  if (!champion) return null;

  try {
    const response = await fetch(`${SERVER_API_BASE}/champions/${champion.id}/page-data`, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json() as ChampionPagePayload;
  } catch {
    return null;
  }
}

export default async function ChampionDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const initialPageData = await getInitialChampionPageData(name);
  return <ChampionDetailPageClient initialPageData={initialPageData} />;
}
