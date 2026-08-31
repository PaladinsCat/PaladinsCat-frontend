/**
 * Render the champions name page and its data composition.
 * Assemble the page content exposed at this location.
 */
import { notFound } from "next/navigation";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { championSlug } from "@/lib/utils";
import { getServerChampionData } from "@/lib/server-champion-data";
import { getInitialChampionPageData } from "@/lib/server-champion-page";
import ChampionDetailPageClient from "./champion-detail-client";

/**
 * Select dynamic rendering for champions name page.
 * Return the framework rendering mode constant used by this page.
 */
export const dynamic = "force-dynamic";

/**
 * Render the ChampionDetailPage view for champions name page.
 * Return the React tree for the declared inputs and page data.
 */
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
