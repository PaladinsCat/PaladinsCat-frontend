/**
 * Define the account layout responsibility boundary.
 * Coordinates account layout data loading, authorization, and presentation.
 */
import type { Metadata } from "next";

/**
 * Supplies canonical metadata for this page or layout.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
