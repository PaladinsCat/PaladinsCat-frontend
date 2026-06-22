import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Paladins Player ${id} Stats, Match History and ELO`,
    description: `View Paladins player ${id} profile stats, ranked match history, champion performance, account ELO, and recent matches on PaladinsCat.`,
    alternates: {
      canonical: `/players/${id}`,
    },
  };
}

export default function PlayerDetailLayout({ children }: Props) {
  return children;
}
