/** Supply localized canonical metadata for platform statistics. · refs: none */
import { createLocalizedMetadata } from "@/lib/server-localization";
/** Generate canonical platform-statistics metadata.  Returns: `Promise<Metadata>`. · refs: none */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.platforms.title", {
    descriptionKey: "seo.stats.platforms.description",
    metadata: { alternates: { canonical: "/stats/platforms" } },
  });
}
/** Preserve the platform-statistics route content.  Returns: `React.JSX.Element`. · refs: none */
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
