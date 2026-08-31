/**
 * Define the stats activity layout route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.activity.title", {
    descriptionKey: "seo.stats.activity.description",
    metadata: { alternates: { canonical: "/stats/activity" } },
  });
}

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export default function PlayerActivityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
