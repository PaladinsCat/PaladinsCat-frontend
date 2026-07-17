import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.egpm.title", {
    descriptionKey: "seo.stats.egpm.description",
    metadata: { alternates: { canonical: "/stats/ecpm" } },
  });
}

export default function EcpmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
