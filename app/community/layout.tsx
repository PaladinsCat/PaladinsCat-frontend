import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.community.title", {
    descriptionKey: "seo.community.description",
    metadata: { alternates: { canonical: "/community" } },
  });
}
export default function CommunityLayout({ children }: { children: React.ReactNode }) { return children; }
