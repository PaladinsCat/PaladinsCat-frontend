/**
 * Pass the /auth layout children through unchanged; route metadata is configured separately.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build localized metadata for /auth, including the title and any canonical, description, and crawler directives configured for this route.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.auth.title", {
    metadata: { robots: { index: false, follow: false } },
  });
}

/**
 * Pass the /auth layout children through unchanged; route metadata is configured separately.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
