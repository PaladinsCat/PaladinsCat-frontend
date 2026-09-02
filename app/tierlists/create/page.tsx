/**
 * Define the tierlists create page responsibility boundary.
 * Coordinates tierlists create page data loading, authorization, and presentation.
 * refs: none
 */
import TierListEditor from "@/components/tier-list-editor";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function CreateTierListPage() {
  return <TierListEditor />;
}
