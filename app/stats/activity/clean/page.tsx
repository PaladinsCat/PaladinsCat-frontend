/**
 * Render /stats/activity/clean.
 * refs: none
 */
import { permanentRedirect } from "next/navigation";

/**
 * Render /stats/activity/clean.
 * refs: none
 * I/O types: `none -> void`.
 */
export default function CleanPlayerActivityPage() {
  permanentRedirect("/stats/activity");
}
