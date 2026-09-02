/**
 * Compose metadata and child content for builds create layout.
 * Keep SEO and nesting behavior local to this layout.
 */
import type { Metadata } from "next";

/**
 * Build SEO metadata for builds create layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 * Returns: `Metadata`
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Render the CreateBuildLayout view for builds create layout.
 * Returns: `React.JSX.Element`
 * Return the React tree for the declared inputs and page data.
 */
export default function CreateBuildLayout({ children }: { children: React.ReactNode }) {
  return children;
}
