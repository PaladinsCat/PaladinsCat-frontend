/**
 * Define the page responsibility boundary.
 * Coordinates page data loading, authorization, and presentation.
 */
import type { Metadata } from "next";
import HomePageClient from "./home-page-client";

/**
 * Supplies canonical metadata for this page or layout.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export default function HomePage() {
  return <HomePageClient />;
}
