import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.maps.title", {
    descriptionKey: "seo.stats.maps.description",
    metadata: { alternates: { canonical: "/stats/maps" } },
  });
}

export default function MapsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
