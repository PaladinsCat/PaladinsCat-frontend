/**
 * Define the auth layout responsibility boundary.
 * Coordinates auth layout data loading, authorization, and presentation.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.auth.title", {
    metadata: { robots: { index: false, follow: false } },
  });
}

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
