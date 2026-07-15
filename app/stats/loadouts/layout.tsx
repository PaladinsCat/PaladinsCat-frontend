import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.loadouts.title", {
    descriptionKey: "seo.stats.loadouts.description",
    metadata: { alternates: { canonical: "/stats/loadouts" } },
  });
}

export default function LoadoutsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
