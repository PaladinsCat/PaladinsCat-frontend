/**
 * Pass the /changelog layout children through unchanged; route metadata is configured separately.
 * refs: none
 */
import { createCanonicalMetadata } from "@/lib/canonical-metadata";

/**
 * Supplies canonical metadata for this page or layout.
 * Returns: `Metadata`
 * refs: none
 */
export const metadata = createCanonicalMetadata("/changelog");
/**
 * Pass the /changelog layout children through unchanged; route metadata is configured separately.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function ChangelogLayout({ children }: { children: React.ReactNode }) { return children; }
