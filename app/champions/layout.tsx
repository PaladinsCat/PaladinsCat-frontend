import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.champions.title", {
    descriptionKey: "seo.champions.description",
    metadata: { alternates: { canonical: "/champions" } },
  });
}

export default function ChampionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
