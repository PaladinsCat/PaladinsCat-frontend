import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.players.parties.title", {
    descriptionKey: "seo.players.parties.description",
    metadata: { alternates: { canonical: "/players/parties" } },
  });
}

export default function RankedPartiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
