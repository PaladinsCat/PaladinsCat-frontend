import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { t } = await getServerLocalization();
  return {
    title: t("common.relationships.title"),
    description: t("common.relationships.description"),
    alternates: { canonical: `/players/${id}/relationships` },
  };
}

export default function PlayerRelationshipsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
