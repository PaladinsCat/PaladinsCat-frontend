/**
 * Pass the /operations/paladinscat-bot layout children through unchanged; route metadata is configured separately.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build localized metadata for /operations/paladinscat-bot, including the title and any canonical, description, and crawler directives configured for this route.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.paladinsCatBot.title", {
    descriptionKey: "seo.paladinsCatBot.description",
    metadata: { alternates: { canonical: "/operations/paladinscat-bot" } },
  });
}

/**
 * Pass the /operations/paladinscat-bot layout children through unchanged; route metadata is configured separately.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function PaladinsCatBotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
