/** Supply localized canonical metadata for the community directory. */
import { createLocalizedMetadata } from "@/lib/server-localization";

/** Generate canonical community metadata. */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.community.title", {
    descriptionKey: "seo.community.description",
    metadata: { alternates: { canonical: "/community" } },
  });
}
/** Preserve community child routes beneath their shared metadata boundary. */
export default function CommunityLayout({ children }: { children: React.ReactNode }) { return children; }
