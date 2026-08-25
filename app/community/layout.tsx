import { createCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata = createCanonicalMetadata("/community");
export default function CommunityLayout({ children }: { children: React.ReactNode }) { return children; }
