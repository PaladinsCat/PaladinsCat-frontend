/**
 * Define the privacy layout responsibility boundary.
 * Coordinates privacy layout data loading, authorization, and presentation.
 */
import { createCanonicalMetadata } from "@/lib/canonical-metadata";

/**
 * Supplies canonical metadata for this page or layout.
 * Returns: `Metadata`
 */
export const metadata = createCanonicalMetadata("/privacy");
/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 */
export default function PrivacyLayout({ children }: { children: React.ReactNode }) { return children; }
