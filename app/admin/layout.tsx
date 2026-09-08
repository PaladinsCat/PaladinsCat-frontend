/**
 * Pass the /admin layout children through unchanged; route metadata is configured separately.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build localized metadata for /admin, including the title and any canonical, description, and crawler directives configured for this route.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.admin.title", {
    metadata: { robots: { index: false, follow: false, nocache: true } },
  });
}

/**
 * Pass the /admin layout children through unchanged; route metadata is configured separately.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
