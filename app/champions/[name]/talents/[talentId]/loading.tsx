/**
 * Provide the loading fallback for champions name talents talentId loading.
 * Render the temporary React tree shown while content resolves.
 * refs: none
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Render the loading fallback for champions name talents talentId loading.
 * Return the temporary React tree shown while page content resolves.
 * refs: none
 * I/O types: `none -> JSX.Element`.
 */
export default function ChampionTalentDetailLoading() {
  return <RouteSkeleton variant="detail" />;
}
