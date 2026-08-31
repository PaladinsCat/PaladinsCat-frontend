/**
 * Define the player route surface for boosted layout and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import { createCanonicalMetadata } from "@/lib/canonical-metadata";
/**
 * Build SEO metadata for the player boosted layout route.
 * Returns the Next.js metadata object consumed by this route without mutating application data.
 */
export const metadata = createCanonicalMetadata("/players/boosted");
/**
 * Render the layout for the player boosted layout route.
 * Returns the route shell around child content using the declared props.
 */
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
