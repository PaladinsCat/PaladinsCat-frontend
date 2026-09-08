/**
 * Pass the /localization layout children through unchanged; route metadata is configured separately.
 * refs: none
 */
import { createCanonicalMetadata } from "@/lib/canonical-metadata";

/**
 * Supplies canonical metadata for this page or layout.
 * Returns: `Metadata`
 * refs: none
 */
export const metadata = createCanonicalMetadata("/localization");
/**
 * Pass the /localization layout children through unchanged; route metadata is configured separately.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function LocalizationLayout({ children }: { children: React.ReactNode }) { return children; }
