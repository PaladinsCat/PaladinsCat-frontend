/**
 * Pass the /features layout children through unchanged; route metadata is configured separately.
 * Coordinates canonical metadata for the public features route.
 * refs: documents/06-reference/frontend-design-system.md#page-anatomy
 */
import { createCanonicalMetadata } from "@/lib/canonical-metadata";

/**
 * Configure the route title, canonical URL, and other declared page metadata.
 * refs: doc: documents/06-reference/routes/frontend-new-features.md
 */
export const metadata = createCanonicalMetadata("/features");

/**
 * Pass the /features layout children through unchanged; route metadata is configured separately.
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 * refs: doc: documents/06-reference/routes/frontend-new-features.md
 */
export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
