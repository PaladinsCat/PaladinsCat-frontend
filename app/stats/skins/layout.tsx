/** Supply localized canonical metadata for skin statistics. */
import { createLocalizedMetadata } from "@/lib/server-localization";
/** Generate canonical skin-statistics metadata. */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.skins.title", {
    descriptionKey: "seo.stats.skins.description",
    metadata: { alternates: { canonical: "/stats/skins" } },
  });
}
/** Preserve the skin-statistics route content. */
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
