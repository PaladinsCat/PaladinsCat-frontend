import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.players.private.title", {
    descriptionKey: "seo.players.private.description",
    metadata: { alternates: { canonical: "/players/private-accounts" } },
  });
}

export default function PrivateAccountsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
