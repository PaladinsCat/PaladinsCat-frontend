import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { championSlug } from "@/lib/utils";
import ChampionDetailPageClient, { type ChampionPagePayload } from "./champion-detail-client";

// The production runtime image is deliberately slim and does not preserve
// build-stage environment values. Its own loopback Next server is always
// present, and its /_pc rewrite forwards to the cached backend route.
const SERVER_DATA_ORIGIN = "http://127.0.0.1:3000";

export const dynamic = "force-dynamic";

async function getInitialChampionPageData(name: string): Promise<ChampionPagePayload | null> {
  const champion = STATIC_CHAMPIONS.find((entry) => championSlug(entry.name) === name.toLowerCase());
  if (!champion) return null;

  try {
    const response = await fetch(`${SERVER_DATA_ORIGIN}/_pc/champions/${champion.id}/page-data`, { cache: "no-store" });
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
