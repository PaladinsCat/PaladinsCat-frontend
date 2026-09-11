/**
 * Compose metadata and child content for game maps layout.
 * Keep SEO and nesting behavior local to this layout.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";
import { VerifiedAccess } from "@/components/verified-access";

/**
 * Build SEO metadata for game maps layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.maps.title", {
    descriptionKey: "seo.stats.maps.description",
    metadata: { alternates: { canonical: "/game/maps" } },
  });
}

/**
 * Pass the /game/maps layout children through unchanged.
 * Render the GameMapsLayout view for game maps layout.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function GameMapsLayout({ children }: { children: React.ReactNode }) {
  return <VerifiedAccess>{children}</VerifiedAccess>;
}
