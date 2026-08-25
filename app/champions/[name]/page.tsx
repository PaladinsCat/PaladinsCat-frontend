import { notFound } from "next/navigation";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { championSlug } from "@/lib/utils";
import { getServerChampionData } from "@/lib/server-champion-data";
import { getInitialChampionPageData } from "@/lib/server-champion-page";
import ChampionDetailPageClient from "./champion-detail-client";

export const dynamic = "force-dynamic";

export default async function ChampionDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const slug = championSlug(name);
  const champion = STATIC_CHAMPIONS.find((entry) => championSlug(entry.name) === slug);
  if (!champion) notFound();

  const [initialChampionData, initialPageData] = await Promise.all([
    getServerChampionData(slug).catch(() => undefined),
    getInitialChampionPageData(slug).catch(() => null),
  ]);

  return (
    <ChampionDetailPageClient
      initialChampionData={initialChampionData}
      initialPageData={initialPageData}
    />
  );
}
