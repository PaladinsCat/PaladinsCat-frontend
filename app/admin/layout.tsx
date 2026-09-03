/**
 * Define the admin layout responsibility boundary.
 * Coordinates admin layout data loading, authorization, and presentation.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `Promise<Metadata>`
 * refs: none
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.admin.title", {
    metadata: { robots: { index: false, follow: false, nocache: true } },
  });
}

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
