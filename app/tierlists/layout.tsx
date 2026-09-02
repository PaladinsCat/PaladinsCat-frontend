/**
 * Define the tierlists layout responsibility boundary.
 * Coordinates tierlists layout data loading, authorization, and presentation.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `Promise<Metadata>`
 * refs: none
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.tierLists.title", {
    descriptionKey: "seo.tierLists.description",
    metadata: { alternates: { canonical: "/tierlists" } },
  });
}

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function TierListsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
