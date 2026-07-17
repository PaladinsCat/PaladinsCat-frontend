import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.operations.title", {
    descriptionKey: "seo.operations.description",
    metadata: { alternates: { canonical: "/operations/stats" } },
  });
}

export default function OperationsStatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
