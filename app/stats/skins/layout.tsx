import { createCanonicalMetadata } from "@/lib/canonical-metadata";
export const metadata = createCanonicalMetadata("/stats/skins");
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
