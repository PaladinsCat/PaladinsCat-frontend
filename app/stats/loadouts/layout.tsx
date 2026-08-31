/**
 * Define the stats loadouts layout route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.loadouts.title", {
    descriptionKey: "seo.stats.loadouts.description",
    metadata: { alternates: { canonical: "/stats/loadouts" } },
  });
}

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export default function LoadoutsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
