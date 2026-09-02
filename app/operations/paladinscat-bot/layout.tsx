/**
 * Define the operations paladinscat bot layout responsibility boundary.
 * Coordinates operations paladinscat bot layout data loading, authorization, and presentation.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `Promise<Metadata>`
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.paladinsCatBot.title", {
    descriptionKey: "seo.paladinsCatBot.description",
    metadata: { alternates: { canonical: "/operations/paladinscat-bot" } },
  });
}

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 */
export default function PaladinsCatBotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
