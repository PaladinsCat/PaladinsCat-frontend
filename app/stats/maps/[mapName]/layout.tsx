/**
 * Pass the /stats/maps/[mapName] layout children through unchanged.
 * refs: none
 */
import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";

type Props = {
  children: React.ReactNode;
  params: Promise<{ mapName: string }>;
};

/**
 * Render /stats/maps/[mapName].
 * refs: none
 * I/O types: `{ params }: Props -> Promise<Metadata>`.
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
 * Pass the /stats/maps/[mapName] layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: Props -> ReactNode`.
 */
export default function MapDetailLayout({ children }: Props) {
  return children;
}
