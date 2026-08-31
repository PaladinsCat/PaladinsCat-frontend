/**
 * Define the community layout responsibility boundary.
 * Coordinates community layout data loading, authorization, and presentation.
 */
import { createCanonicalMetadata } from "@/lib/canonical-metadata";

/**
 * Supplies canonical metadata for this page or layout.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export const metadata = createCanonicalMetadata("/community");
/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export default function CommunityLayout({ children }: { children: React.ReactNode }) { return children; }
