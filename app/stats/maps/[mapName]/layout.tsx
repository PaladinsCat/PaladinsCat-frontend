/**
 * Define the stats maps layout route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";

type Props = {
  children: React.ReactNode;
  params: Promise<{ mapName: string }>;
};

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mapName } = await params;
  const name = decodeURIComponent(mapName).replace(/^Ranked\s+/i, "");
  const canonicalName = encodeURIComponent(decodeURIComponent(mapName));
  const { t } = await getServerLocalization();

  return {
    title: t("seo.stats.maps.detail.title", { name }),
    description: t("seo.stats.maps.detail.description", { name }),
    alternates: { canonical: `/stats/maps/${canonicalName}` },
  };
}

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export default function MapDetailLayout({ children }: Props) {
  return children;
}
