/**
 * Define the localization layout responsibility boundary.
 * Coordinates localization layout data loading, authorization, and presentation.
 */
import { createCanonicalMetadata } from "@/lib/canonical-metadata";

/**
 * Supplies canonical metadata for this page or layout.
 * Returns: `Metadata`
 */
export const metadata = createCanonicalMetadata("/localization");
/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 */
export default function LocalizationLayout({ children }: { children: React.ReactNode }) { return children; }
