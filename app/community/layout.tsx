/** Supply localized canonical metadata for the community directory. · refs: none */
import { createLocalizedMetadata } from "@/lib/server-localization";

/** Generate canonical community metadata.  Returns: `Promise<Metadata>`. · refs: none */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.community.title", {
    descriptionKey: "seo.community.description",
    metadata: { alternates: { canonical: "/community" } },
  });
}
/** Preserve community child routes beneath their shared metadata boundary.  Returns: `React.JSX.Element`. · refs: none */
export default function CommunityLayout({ children }: { children: React.ReactNode }) { return children; }
