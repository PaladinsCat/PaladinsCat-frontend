import { createCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata = createCanonicalMetadata("/builds");
export default function BuildsLayout({ children }: { children: React.ReactNode }) { return children; }
