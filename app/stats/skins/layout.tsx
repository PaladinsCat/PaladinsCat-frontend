import { createLocalizedMetadata } from "@/lib/server-localization";
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.skins.title", {
    descriptionKey: "seo.stats.skins.description",
    metadata: { alternates: { canonical: "/stats/skins" } },
  });
}
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
