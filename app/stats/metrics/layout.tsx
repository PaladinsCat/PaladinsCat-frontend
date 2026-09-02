/**
 * Define the stats metrics layout route boundary.
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
  return createLocalizedMetadata("seo.stats.metrics.title", {
    descriptionKey: "seo.stats.metrics.description",
    metadata: { alternates: { canonical: "/stats/metrics" } },
  });
}

/**
 * Renders the exported statistics view with its route data.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function MetricsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
