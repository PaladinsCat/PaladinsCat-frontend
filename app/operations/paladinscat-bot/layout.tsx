import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.paladinsCatBot.title", {
    descriptionKey: "seo.paladinsCatBot.description",
    metadata: { alternates: { canonical: "/operations/paladinscat-bot" } },
  });
}

export default function PaladinsCatBotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
