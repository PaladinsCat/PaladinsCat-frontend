import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.items.title", {
    descriptionKey: "seo.stats.items.description",
    metadata: { alternates: { canonical: "/game/items" } },
  });
}

export default function GameItemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
