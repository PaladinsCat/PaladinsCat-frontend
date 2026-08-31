/**
 * Compose metadata and child content for builds layout.
 * Keep SEO and nesting behavior local to this layout.
 */
import { createCanonicalMetadata } from "@/lib/canonical-metadata";

/**
 * Build SEO metadata for builds layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 */
export const metadata = createCanonicalMetadata("/builds");
/**
 * Render the BuildsLayout view for builds layout.
 * Return the React tree for the declared inputs and page data.
 */
export default function BuildsLayout({ children }: { children: React.ReactNode }) { return children; }
