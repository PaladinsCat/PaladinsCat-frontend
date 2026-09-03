/**
 * Define the community diminishing returns layout responsibility boundary.
 * Coordinates community diminishing returns layout data loading, authorization, and presentation.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `Promise<Metadata>`
 * refs: none
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.community.diminishingReturns.title", {
    descriptionKey: "seo.community.diminishingReturns.description",
    metadata: { alternates: { canonical: "/community/diminishing-returns" } },
  });
}

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function DiminishingReturnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
