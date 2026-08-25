import { createCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata = createCanonicalMetadata("/contact");
export default function ContactLayout({ children }: { children: React.ReactNode }) { return children; }
