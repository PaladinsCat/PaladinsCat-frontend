import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.title", {
    descriptionKey: "seo.stats.description",
  });
}

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
