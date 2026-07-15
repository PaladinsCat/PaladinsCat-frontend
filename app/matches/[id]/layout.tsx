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
    title: t("seo.matches.detail.title", { id }),
    description: t("seo.matches.detail.description", { id }),
    alternates: {
      canonical: `/matches/${id}`,
    },
  };
}

export default function MatchDetailLayout({ children }: Props) {
  return children;
}
