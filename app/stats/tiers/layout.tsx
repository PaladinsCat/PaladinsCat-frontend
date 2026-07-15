import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.tiers.title", {
    descriptionKey: "seo.stats.tiers.description",
    metadata: { alternates: { canonical: "/stats/tiers" } },
  });
}

export default function TiersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
