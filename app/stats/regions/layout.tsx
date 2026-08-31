/** Supply localized canonical metadata for regional statistics. */
import { createLocalizedMetadata } from "@/lib/server-localization";
/** Generate canonical regional-statistics metadata. */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.regions.title", {
    descriptionKey: "seo.stats.regions.description",
    metadata: { alternates: { canonical: "/stats/regions" } },
  });
}
/** Preserve the regional-statistics route content. */
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
