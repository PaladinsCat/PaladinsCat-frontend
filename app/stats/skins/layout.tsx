/**
 * Define the stats skins layout route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import { createCanonicalMetadata } from "@/lib/canonical-metadata";
/**
 * Supplies canonical metadata for this statistics route.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export const metadata = createCanonicalMetadata("/stats/skins");
/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
