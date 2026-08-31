/** Supply localized canonical metadata for platform statistics. */
import { createLocalizedMetadata } from "@/lib/server-localization";
/** Generate canonical platform-statistics metadata. */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.platforms.title", {
    descriptionKey: "seo.stats.platforms.description",
    metadata: { alternates: { canonical: "/stats/platforms" } },
  });
}
/** Preserve the platform-statistics route content. */
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
