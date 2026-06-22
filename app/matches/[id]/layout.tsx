import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Paladins Match ${id} Stats, Players, Builds and Results`,
    description: `View Paladins match ${id} results, player stats, champion picks, bans, talents, items, loadout cards, damage, healing, credits, and ELO changes.`,
    alternates: {
      canonical: `/matches/${id}`,
    },
  };
}

export default function MatchDetailLayout({ children }: Props) {
  return children;
}
