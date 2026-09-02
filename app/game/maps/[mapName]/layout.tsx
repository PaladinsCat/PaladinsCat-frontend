/**
 * Compose metadata and child content for game maps mapName layout.
 * Keep SEO and nesting behavior local to this layout.
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
 * Returns: `Promise<Metadata>`
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
 * Render the MapDetailLayout view for game maps mapName layout.
 * Return the React tree for the declared inputs and page data.
 * Returns: `React.JSX.Element`
 */
export default function MapDetailLayout({ children }: Props) {
  return children;
}
