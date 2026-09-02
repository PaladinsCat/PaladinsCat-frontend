/** Supply localized canonical metadata for regional statistics. */
import { createLocalizedMetadata } from "@/lib/server-localization";
/** Generate canonical regional-statistics metadata.  Returns: `Promise<Metadata>`. */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.regions.title", {
    descriptionKey: "seo.stats.regions.description",
    metadata: { alternates: { canonical: "/stats/regions" } },
  });
}
/** Preserve the regional-statistics route content.  Returns: `React.JSX.Element`. */
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
