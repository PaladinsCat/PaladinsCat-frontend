import { createCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata = createCanonicalMetadata("/privacy");
export default function PrivacyLayout({ children }: { children: React.ReactNode }) { return children; }
