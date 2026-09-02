/**
 * Define the operations stats layout responsibility boundary.
 * Coordinates operations stats layout data loading, authorization, and presentation.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `Promise<Metadata>`
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.operations.title", {
    descriptionKey: "seo.operations.description",
    metadata: { alternates: { canonical: "/operations/stats" } },
  });
}

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 */
export default function OperationsStatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
