import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ itemId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { itemId } = await params;

  return {
    alternates: { canonical: `/game/items/${encodeURIComponent(itemId)}` },
  };
}

export default function ItemDetailLayout({ children }: Props) {
  return children;
}
