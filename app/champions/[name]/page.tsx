import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { championSlug } from "@/lib/utils";
import ChampionDetailPageClient, { type ChampionPagePayload } from "./champion-detail-client";

// Production rendering uses the same public same-origin proxy path that is
// verified for browser clients. The backend response is Redis-cached, so this
// remains a fast cache-first request without exposing a direct backend port.
const SERVER_DATA_ORIGIN = process.env.NODE_ENV === "production"
  ? "https://paladinscat.com"
  : "http://127.0.0.1:3000";

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
