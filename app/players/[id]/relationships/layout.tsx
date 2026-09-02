/**
 * Define the player route surface for id relationships layout and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";

/**
 * Build SEO metadata for the player id relationships layout route.
 * Returns the Next.js metadata object consumed by this route without mutating application data.
 * Returns: `Promise<Metadata>`
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { t } = await getServerLocalization();
  return {
    title: t("common.relationships.title"),
    description: t("common.relationships.description"),
    alternates: { canonical: `/players/${id}/relationships` },
  };
}

/**
 * Render the layout for the player id relationships layout route.
 * Returns the route shell around child content using the declared props.
 */
export default function PlayerRelationshipsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
