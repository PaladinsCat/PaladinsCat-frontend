/**
 * Compose metadata and child content for champions name layout.
 * Keep SEO and nesting behavior local to this layout.
 */
import type { Metadata } from "next";
import { preload } from "react-dom";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { getServerLocalization } from "@/lib/server-localization";
import type { TranslationKey } from "@/lib/localization/messages";

type Props = {
  children: React.ReactNode;
  params: Promise<{ name: string }>;
};

function championFromSlug(slug: string) {
  return STATIC_CHAMPIONS.find((champion) => championSlug(champion.name) === slug.toLowerCase());
}

const ROLE_KEYS: Record<string, TranslationKey> = {
  Frontline: "common.roles.frontline",
  Damage: "common.roles.damage",
  Flank: "common.roles.flank",
  Support: "common.roles.support",
};

/**
 * Build SEO metadata for champions name layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 * Returns: `Promise<Metadata>`
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const champion = championFromSlug(name);
  const displayName = champion?.name ?? name;
  const { t } = await getServerLocalization();
  const roles = champion?.roles?.map((role) => ROLE_KEYS[role] ? t(ROLE_KEYS[role]) : role).join(", ");
  const roleText = roles ? t("seo.champions.role", { role: roles }) : t("seo.champions.roleGeneric");
  const canonical = `/champions/${champion ? championSlug(champion.name) : name}`;

  return {
    title: t("seo.champions.detail.title", { name: displayName }),
    description: t("seo.champions.detail.description", { name: displayName, role: roleText }),
    alternates: { canonical },
    openGraph: {
      title: t("seo.champions.detail.openGraphTitle", { name: displayName }),
      description: t("seo.champions.detail.openGraphDescription", { name: displayName }),
      url: canonical,
    },
  };
}

/**
 * Render the ChampionDetailLayout view for champions name layout.
 * Return the React tree for the declared inputs and page data.
 * Returns: `Promise<React.JSX.Element>`
 */
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
