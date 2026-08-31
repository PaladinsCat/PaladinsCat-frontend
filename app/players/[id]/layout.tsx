/**
 * Define the player route surface for id layout and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

/**
 * Build SEO metadata for the player id layout route.
 * Returns the Next.js metadata object consumed by this route without mutating application data.
 */
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

/**
 * Render the layout for the player id layout route.
 * Returns the route shell around child content using the declared props.
 */
export default function PlayerDetailLayout({ children }: Props) {
  return children;
}
