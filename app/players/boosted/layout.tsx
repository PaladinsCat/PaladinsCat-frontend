import { createCanonicalMetadata } from "@/lib/canonical-metadata";
export const metadata = createCanonicalMetadata("/players/boosted");
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
