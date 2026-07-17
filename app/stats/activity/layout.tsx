import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.activity.title", {
    descriptionKey: "seo.stats.activity.description",
    metadata: { alternates: { canonical: "/stats/activity" } },
  });
}

export default function PlayerActivityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
