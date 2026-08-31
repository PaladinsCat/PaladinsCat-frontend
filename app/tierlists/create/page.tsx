/**
 * Define the tierlists create page responsibility boundary.
 * Coordinates tierlists create page data loading, authorization, and presentation.
 */
import TierListEditor from "@/components/tier-list-editor";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export default function CreateTierListPage() {
  return <TierListEditor />;
}
