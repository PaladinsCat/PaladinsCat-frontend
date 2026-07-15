import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.matches.title", {
    descriptionKey: "seo.matches.description",
    metadata: { alternates: { canonical: "/matches" } },
  });
}

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
