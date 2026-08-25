import { createCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata = createCanonicalMetadata("/changelog");
export default function ChangelogLayout({ children }: { children: React.ReactNode }) { return children; }
