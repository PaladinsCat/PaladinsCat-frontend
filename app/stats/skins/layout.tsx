/** Supply localized canonical metadata for skin statistics. · refs: none */
import { createLocalizedMetadata } from "@/lib/server-localization";
/** Generate canonical skin-statistics metadata.  Returns: `Promise<Metadata>`. · refs: none */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.skins.title", {
    descriptionKey: "seo.stats.skins.description",
    metadata: { alternates: { canonical: "/stats/skins" } },
  });
}
/** Preserve the skin-statistics route content.  Returns: `React.JSX.Element`. · refs: none */
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
