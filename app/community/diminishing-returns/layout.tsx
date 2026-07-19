import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.community.diminishingReturns.title", {
    descriptionKey: "seo.community.diminishingReturns.description",
    metadata: { alternates: { canonical: "/community/diminishing-returns" } },
  });
}

export default function DiminishingReturnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
