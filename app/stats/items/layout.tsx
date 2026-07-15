import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.items.title", {
    descriptionKey: "seo.stats.items.description",
    metadata: { alternates: { canonical: "/stats/items" } },
  });
}

export default function ItemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
