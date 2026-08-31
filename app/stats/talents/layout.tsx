/**
 * Define the stats talents layout route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.talents.title", {
    descriptionKey: "seo.stats.talents.description",
    metadata: { alternates: { canonical: "/stats/talents" } },
  });
}

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export default function TalentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
