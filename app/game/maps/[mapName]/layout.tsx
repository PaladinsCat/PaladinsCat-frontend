/**
 * Compose metadata and child content for game maps mapName layout.
 * Keep SEO and nesting behavior local to this layout.
 * refs: none
 */
import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";

type Props = {
  children: React.ReactNode;
  params: Promise<{ mapName: string }>;
};

/**
 * Build SEO metadata for game maps mapName layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 * refs: none
 * I/O types: `{ params }: Props -> Promise<Metadata>`.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mapName } = await params;
  const decodedName = decodeURIComponent(mapName);
  const name = decodedName.replace(/^Ranked\s+/i, "");
  const canonicalName = encodeURIComponent(decodedName);
  const { t } = await getServerLocalization();

  return {
    title: t("seo.stats.maps.detail.title", { name }),
    description: t("seo.stats.maps.detail.description", { name }),
    alternates: { canonical: `/game/maps/${canonicalName}` },
  };
}

/**
 * Pass the /game/maps/[mapName] layout children through unchanged.
 * Render the MapDetailLayout view for game maps mapName layout.
 * refs: none
 * I/O types: `{ children }: Props -> ReactNode`.
 */
export default function MapDetailLayout({ children }: Props) {
  return children;
}
