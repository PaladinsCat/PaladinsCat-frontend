/**
 * Define the about layout responsibility boundary.
 * Coordinates about layout data loading, authorization, and presentation.
 */
import { createCanonicalMetadata } from "@/lib/canonical-metadata";

/**
 * Supplies canonical metadata for this page or layout.
 * Returns: `Metadata`
 */
export const metadata = createCanonicalMetadata("/about");
/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 */
export default function AboutLayout({ children }: { children: React.ReactNode }) { return children; }
