import { createCanonicalMetadata } from "@/lib/canonical-metadata";
export const metadata = createCanonicalMetadata("/stats/platforms");
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
