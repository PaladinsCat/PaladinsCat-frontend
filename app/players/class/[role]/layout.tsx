import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
};

function titleCaseRole(role: string) {
  return role
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { role } = await params;
  const displayRole = titleCaseRole(role);

  return {
    title: `Paladins ${displayRole} Stats — Champion Rankings and ELO`,
    description: `Compare Paladins ${displayRole} champion stats, win rates, performance averages, ranked data, and champion ELO leaderboards.`,
    alternates: {
      canonical: `/players/class/${role}`,
    },
  };
}

export default function PlayerClassLayout({ children }: Props) {
  return children;
}
