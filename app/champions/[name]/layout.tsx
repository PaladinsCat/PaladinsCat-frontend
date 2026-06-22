import type { Metadata } from "next";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { championSlug } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  params: Promise<{ name: string }>;
};

function championFromSlug(slug: string) {
  return STATIC_CHAMPIONS.find((champion) => championSlug(champion.name) === slug.toLowerCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const champion = championFromSlug(name);
  const displayName = champion?.name ?? name;
  const roleText = champion?.roles?.length ? `${champion.roles.join(", ")} champion` : "champion";

  return {
    title: `${displayName} Paladins Stats, Cards, Talents & ELO`,
    description: `View ${displayName} Paladins stats, ${roleText} win rate, ban rate, cards, talents, abilities, loadouts, and champion ELO leaderboard.`,
    alternates: {
      canonical: `/champions/${champion ? championSlug(champion.name) : name}`,
    },
    openGraph: {
      title: `${displayName} Paladins Stats`,
      description: `Ranked ${displayName} stats, abilities, talents, loadout cards, win rate, ban rate, and player leaderboard.`,
      url: `/champions/${champion ? championSlug(champion.name) : name}`,
    },
  };
}

export default function ChampionDetailLayout({ children }: Props) {
  return children;
}
