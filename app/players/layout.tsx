/**
 * Render the layout for the player layout route.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";
import { VerifiedAccess } from "@/components/verified-access";

/**
 * Build SEO metadata for the player layout route.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.players.title", {
    descriptionKey: "seo.players.description",
  });
}

/**
 * Render the layout for the player layout route.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return <VerifiedAccess>{children}</VerifiedAccess>;
}
