import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.banRate.title", {
    descriptionKey: "seo.stats.banRate.description",
    metadata: { alternates: { canonical: "/stats/banrate" } },
  });
}

export default function BanrateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
