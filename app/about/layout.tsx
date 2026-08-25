import { createCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata = createCanonicalMetadata("/about");
export default function AboutLayout({ children }: { children: React.ReactNode }) { return children; }
