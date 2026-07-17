import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.game.compositions.title", {
    descriptionKey: "seo.game.compositions.description",
    metadata: { alternates: { canonical: "/game/compositions" } },
  });
}

export default function TeamCompositionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
