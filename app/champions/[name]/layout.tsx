import type { Metadata } from "next";
import { preload } from "react-dom";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { getChampionIconSafe } from "@/lib/champion-icons";
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

export default async function ChampionDetailLayout({ children, params }: Props) {
  const { name } = await params;
  const champion = championFromSlug(name);

  // The page body is client-rendered, so advertise its above-the-fold hero
  // image from the server layout instead of waiting for hydration to discover
  // it. This is the champion detail page's most common LCP candidate.
  preload(getChampionIconSafe(champion?.name ?? name), {
    as: "image",
    fetchPriority: "high",
  });

  return children;
}
