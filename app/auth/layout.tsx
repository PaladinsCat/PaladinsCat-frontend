import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.auth.title", {
    metadata: { robots: { index: false, follow: false } },
  });
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
