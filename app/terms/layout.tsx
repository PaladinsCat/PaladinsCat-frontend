import { createCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata = createCanonicalMetadata("/terms");
export default function TermsLayout({ children }: { children: React.ReactNode }) { return children; }
