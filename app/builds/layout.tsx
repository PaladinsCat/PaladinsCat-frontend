import { createLocalizedMetadata, getServerLocalization } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.builds.title", {
    descriptionKey: "seo.builds.description",
    metadata: { alternates: { canonical: "/builds" } },
  });
}

export default async function BuildsLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getServerLocalization();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("seo.builds.heading")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-pc-text-secondary">{t("seo.builds.description")}</p>
      </header>
      {children}
    </div>
  );
}
