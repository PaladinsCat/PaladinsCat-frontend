/**
 * Define the stats tiers layout route boundary.
 * Coordinates this module's route data flow and rendered output.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Renders the exported statistics view with its route data.
 * Returns: `Promise<Metadata>`
 * refs: none
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.tiers.title", {
    descriptionKey: "seo.stats.tiers.description",
    metadata: { alternates: { canonical: "/stats/tiers" } },
  });
}

/**
 * Renders the exported statistics view with its route data.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function TiersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
