/**
 * Compose metadata and child content for matches id layout.
 * Keep SEO and nesting behavior local to this layout.
 */
import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

/**
 * Build SEO metadata for matches id layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { t } = await getServerLocalization();

  return {
    title: t("seo.matches.detail.title", { id }),
    description: t("seo.matches.detail.description", { id }),
    alternates: {
      canonical: `/matches/${id}`,
    },
  };
}

/**
 * Render the MatchDetailLayout view for matches id layout.
 * Return the React tree for the declared inputs and page data.
 */
export default function MatchDetailLayout({ children }: Props) {
  return children;
}
