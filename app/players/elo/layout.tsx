import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.players.elo.title", {
    descriptionKey: "seo.players.elo.description",
    metadata: { alternates: { canonical: "/players/elo" } },
  });
}

export default function PlayerEloLayout({ children }: { children: React.ReactNode }) {
  return children;
}
