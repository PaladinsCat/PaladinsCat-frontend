/**
 * Define the stats performance layout route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.metrics.title", {
    descriptionKey: "seo.stats.metrics.description",
    metadata: { alternates: { canonical: "/stats/performance" } },
  });
}

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
