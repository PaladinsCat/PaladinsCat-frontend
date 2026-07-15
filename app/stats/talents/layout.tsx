import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.talents.title", {
    descriptionKey: "seo.stats.talents.description",
    metadata: { alternates: { canonical: "/stats/talents" } },
  });
}

export default function TalentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
