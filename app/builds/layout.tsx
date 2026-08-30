import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.builds.title", {
    descriptionKey: "seo.builds.description",
    metadata: { alternates: { canonical: "/builds" } },
  });
}
export default function BuildsLayout({ children }: { children: React.ReactNode }) { return children; }
