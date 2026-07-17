import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return createLocalizedMetadata("seo.tierLists.title", {
    descriptionKey: "seo.tierLists.description",
    metadata: { alternates: { canonical: `/tierlists/${encodeURIComponent(id)}` } },
  });
}

export default function TierListDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
