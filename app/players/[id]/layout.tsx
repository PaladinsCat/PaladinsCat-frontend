/**
 * Define the player route surface for id layout and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";
import { absoluteUrl, cleanDescription, cleanSeoLabel, isPublicPlayerId } from "@/lib/seo";
import { getServerPlayerProfile } from "@/lib/player-profile-server";
import { playerAvatarProxyPath } from "@/lib/player-avatar-proxy";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

/**
 * Build SEO metadata for the player id layout route.
 * Returns the Next.js metadata object consumed by this route without mutating application data.
 * Returns: `Promise<Metadata>`
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { t } = await getServerLocalization();
  if (!isPublicPlayerId(id)) {
    return {
      title: t("seo.players.detail.title", { id }),
      description: t("seo.players.detail.description", { id }),
      robots: { index: false, follow: false },
    };
  }

  try {
    const response = await getServerPlayerProfile(id);
    const player = response.player;
    if (player?.name) {
      const name = cleanSeoLabel(player.name, `Player ${id}`);
      const title = t("seo.players.detail.namedTitle", { name });
      const description = cleanDescription(t("seo.players.detail.namedDescription", { name }));
      const canonical = `/players/${id}`;
      const avatarPath = playerAvatarProxyPath(Number(player.avatar_id), player.avatar_url);
      const images = avatarPath
        ? [{ url: absoluteUrl(avatarPath), width: 96, height: 96, alt: `${name} Paladins avatar` }]
        : undefined;

      return {
        title,
        description,
        alternates: { canonical },
        openGraph: { title, description, url: canonical, type: "profile", images },
        twitter: { card: "summary", title, description, images: images?.map((image) => image.url) },
      };
    }
  } catch {
    // Keep the public client fallback indexable when the server API has a
    // transient failure; the page body independently retries after hydration.
  }

  return {
    title: t("seo.players.detail.title", { id }),
    description: t("seo.players.detail.description", { id }),
    alternates: {
      canonical: `/players/${id}`,
    },
  };
}

/**
 * Render the layout for the player id layout route.
 * Returns the route shell around child content using the declared props.
 */
export default function PlayerDetailLayout({ children }: Props) {
  return children;
}
