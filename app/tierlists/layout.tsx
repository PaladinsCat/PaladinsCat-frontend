import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.tierLists.title", {
    descriptionKey: "seo.tierLists.description",
    metadata: { alternates: { canonical: "/tierlists" } },
  });
}

export default function TierListsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
