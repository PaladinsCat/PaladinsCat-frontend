import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";

type Props = {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
};

function titleCaseRole(role: string) {
  return role
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { role } = await params;
  const displayRole = titleCaseRole(role);
  const { t } = await getServerLocalization();

  return {
    title: t("seo.players.class.title", { role: displayRole }),
    description: t("seo.players.class.description", { role: displayRole }),
    alternates: {
      canonical: `/players/class/${role}`,
    },
  };
}

export default function PlayerClassLayout({ children }: Props) {
  return children;
}
