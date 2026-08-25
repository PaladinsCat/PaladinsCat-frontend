import { createCanonicalMetadata } from "@/lib/canonical-metadata";
export const metadata = createCanonicalMetadata("/stats/regions");
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
