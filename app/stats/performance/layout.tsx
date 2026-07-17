import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.metrics.title", {
    descriptionKey: "seo.stats.metrics.description",
    metadata: { alternates: { canonical: "/stats/performance" } },
  });
}

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
