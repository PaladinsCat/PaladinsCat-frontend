/**
 * Define the features landing-page metadata boundary.
 * Coordinates canonical metadata for the public features route.
 * refs: documents/06-reference/frontend-design-system.md#page-anatomy
 */
import { createCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata = createCanonicalMetadata("/features");

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
