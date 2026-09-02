/**
 * Define the player route surface for wall-shooters page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import WallShooterDirectory from "@/components/wall-shooter-directory";

/**
 * Render the WallShootersPage view for the player wall-shooters page route.
 * Returns: `React.JSX.Element`
 */
export default function WallShootersPage() {
  return <WallShooterDirectory />;
}
