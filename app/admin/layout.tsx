import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.admin.title", {
    metadata: { robots: { index: false, follow: false, nocache: true } },
  });
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
