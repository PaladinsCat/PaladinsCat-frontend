import { createLocalizedMetadata } from "@/lib/server-localization";
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.platforms.title", {
    descriptionKey: "seo.stats.platforms.description",
    metadata: { alternates: { canonical: "/stats/platforms" } },
  });
}
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
