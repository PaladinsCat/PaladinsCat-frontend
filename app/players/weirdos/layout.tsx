/**
 * Define the player route surface for weirdos layout and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
import { createCanonicalMetadata } from "@/lib/canonical-metadata";
/**
 * Build SEO metadata for the player weirdos layout route.
 * Returns: `Metadata`
 * refs: none
 */
export const metadata = createCanonicalMetadata("/players/weirdos");
/**
 * Render the layout for the player weirdos layout route.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
