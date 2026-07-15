import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.players.title", {
    descriptionKey: "seo.players.description",
    metadata: { alternates: { canonical: "/players" } },
  });
}

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
