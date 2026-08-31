/**
 * Compose metadata and child content for game items itemId layout.
 * Keep SEO and nesting behavior local to this layout.
 */
import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ itemId: string }>;
};

/**
 * Build SEO metadata for game items itemId layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { itemId } = await params;

  return {
    alternates: { canonical: `/game/items/${encodeURIComponent(itemId)}` },
  };
}

/**
 * Render the ItemDetailLayout view for game items itemId layout.
 * Return the React tree for the declared inputs and page data.
 */
export default function ItemDetailLayout({ children }: Props) {
  return children;
}
