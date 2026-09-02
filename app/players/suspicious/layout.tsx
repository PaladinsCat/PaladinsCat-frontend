/**
 * Define the player route surface for suspicious layout and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import { createCanonicalMetadata } from "@/lib/canonical-metadata";
/**
 * Build SEO metadata for the player suspicious layout route.
 * Returns: `Metadata`
 */
export const metadata = createCanonicalMetadata("/players/suspicious");
/**
 * Render the layout for the player suspicious layout route.
 * Returns: `React.JSX.Element`
 */
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
