import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ mapName: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mapName } = await params;
  const name = decodeURIComponent(mapName).replace(/^Ranked\s+/i, "");
  const canonicalName = encodeURIComponent(decodeURIComponent(mapName));

  return {
    title: `${name} Paladins Map Stats, Distribution and Meta`,
    description: `Explore Paladins ranked stats for ${name}: map distribution, champion picks and bans, talent performance, and item choices.`,
    alternates: { canonical: `/stats/maps/${canonicalName}` },
  };
}

export default function MapDetailLayout({ children }: Props) {
  return children;
}
