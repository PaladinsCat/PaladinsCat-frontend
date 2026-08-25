import { createCanonicalMetadata } from "@/lib/canonical-metadata";
export const metadata = createCanonicalMetadata("/players/hall-of-fame");
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
