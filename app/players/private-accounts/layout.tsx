/**
 * Define the player route surface for private-accounts layout and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for the player private-accounts layout route.
 * Returns the Next.js metadata object consumed by this route without mutating application data.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.players.private.title", {
    descriptionKey: "seo.players.private.description",
    metadata: { alternates: { canonical: "/players/private-accounts" } },
  });
}

/**
 * Render the layout for the player private-accounts layout route.
 * Returns the route shell around child content using the declared props.
 */
export default function PrivateAccountsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
