/**
 * Pass the /account layout children through unchanged; route metadata is configured separately.
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
 * Pass the /account layout children through unchanged; route metadata is configured separately.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
