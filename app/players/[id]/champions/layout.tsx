import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { t } = await getServerLocalization();
  return {
    title: t("common.playerChampions.title"),
    description: t("common.playerChampions.cardDescription"),
    alternates: { canonical: `/players/${encodeURIComponent(id)}/champions` },
  };
}

export default function PlayerChampionStatsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
