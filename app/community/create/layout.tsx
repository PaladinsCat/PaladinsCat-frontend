/**
 * Define the community create layout responsibility boundary.
 * Coordinates community create layout data loading, authorization, and presentation.
 * refs: none
 */
import type { Metadata } from "next";

/**
 * Supplies canonical metadata for this page or layout.
 * Returns: `Metadata`
 * refs: none
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function CreateCommunityPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
