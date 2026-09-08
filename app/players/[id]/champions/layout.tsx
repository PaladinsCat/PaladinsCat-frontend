/**
 * Render the layout for the player id champions layout route.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";

/**
 * Build SEO metadata for the player id champions layout route.
 * refs: none
 * I/O types: `{ params }: { params: Promise<{ id: string }> } -> Promise<Metadata>`.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { t } = await getServerLocalization();
  return {
    title: t("common.playerChampions.title"),
    description: t("common.playerChampions.cardDescription"),
    alternates: { canonical: `/players/${encodeURIComponent(id)}/champions` },
  };
}

/**
 * Render the layout for the player id champions layout route.
 * refs: none
 * I/O types: `{ children }: Readonly<{ children: React.ReactNode }> -> ReactNode`.
 */
export default function PlayerChampionStatsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
