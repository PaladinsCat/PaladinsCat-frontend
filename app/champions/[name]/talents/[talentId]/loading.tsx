/**
 * Provide the loading fallback for champions name talents talentId loading.
 * Render the temporary React tree shown while content resolves.
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Render the loading fallback for champions name talents talentId loading.
 * Return the temporary React tree shown while page content resolves.
 * Returns: `React.JSX.Element`
 */
export default function ChampionTalentDetailLoading() {
  return <RouteSkeleton variant="detail" />;
}
