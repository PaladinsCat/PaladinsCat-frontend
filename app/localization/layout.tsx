import { createCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata = createCanonicalMetadata("/localization");
export default function LocalizationLayout({ children }: { children: React.ReactNode }) { return children; }
