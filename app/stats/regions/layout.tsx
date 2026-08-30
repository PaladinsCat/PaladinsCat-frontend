import { createLocalizedMetadata } from "@/lib/server-localization";
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.regions.title", {
    descriptionKey: "seo.stats.regions.description",
    metadata: { alternates: { canonical: "/stats/regions" } },
  });
}
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
