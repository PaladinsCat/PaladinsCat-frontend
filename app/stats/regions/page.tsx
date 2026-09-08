/** Regional activity is owned by the consolidated Player Activity dashboard.
 * refs: none
 */
import { permanentRedirect } from "next/navigation";
/**
 * Compute regions page.
 * I/O types: `none -> void`.
 * refs: none
 */
export default function RegionsPage() {
  permanentRedirect("/stats/activity#regions");
}
