import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { t } = await getServerLocalization();

  return {
    title: t("seo.players.detail.title", { id }),
    description: t("seo.players.detail.description", { id }),
    alternates: {
      canonical: `/players/${id}`,
    },
  };
}

export default function PlayerDetailLayout({ children }: Props) {
  return children;
}
