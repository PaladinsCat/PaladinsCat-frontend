/**
 * Pass the /terms layout children through unchanged; route metadata is configured separately.
 * refs: none
 */
import { createCanonicalMetadata } from "@/lib/canonical-metadata";

/**
 * Supplies canonical metadata for this page or layout.
 * Returns: `Metadata`
 * refs: none
 */
export const metadata = createCanonicalMetadata("/terms");
/**
 * Pass the /terms layout children through unchanged; route metadata is configured separately.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function TermsLayout({ children }: { children: React.ReactNode }) { return children; }
