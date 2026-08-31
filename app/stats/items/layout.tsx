/**
 * Define the stats items layout route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.items.title", {
    descriptionKey: "seo.stats.items.description",
    metadata: { alternates: { canonical: "/stats/items" } },
  });
}

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export default function ItemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
