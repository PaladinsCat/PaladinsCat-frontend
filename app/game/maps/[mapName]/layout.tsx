import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";

type Props = {
  children: React.ReactNode;
  params: Promise<{ mapName: string }>;
};

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

export default function MapDetailLayout({ children }: Props) {
  return children;
}
