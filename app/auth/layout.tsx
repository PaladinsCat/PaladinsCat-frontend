/**
 * Define the auth layout responsibility boundary.
 * Coordinates auth layout data loading, authorization, and presentation.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `Promise<Metadata>`
 * refs: none
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.auth.title", {
    metadata: { robots: { index: false, follow: false } },
  });
}

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
