import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.tierLists.title", {
    descriptionKey: "seo.tierLists.description",
    metadata: { alternates: { canonical: "/tierlists/create" } },
  });
}

export default function CreateTierListLayout({ children }: { children: React.ReactNode }) {
  return children;
}
