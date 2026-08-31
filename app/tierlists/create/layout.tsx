/**
 * Define the tierlists create layout responsibility boundary.
 * Coordinates tierlists create layout data loading, authorization, and presentation.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.tierLists.title", {
    descriptionKey: "seo.tierLists.description",
    metadata: { alternates: { canonical: "/tierlists/create" } },
  });
}

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export default function CreateTierListLayout({ children }: { children: React.ReactNode }) {
  return children;
}
