/** Platform activity is owned by the consolidated Player Activity dashboard.
 * refs: none
 */
import { permanentRedirect } from "next/navigation";
/**
 * Compute platforms page.
 * I/O types: `none -> void`.
 * refs: none
 */
export default function PlatformsPage() {
  permanentRedirect("/stats/activity#platforms");
}
