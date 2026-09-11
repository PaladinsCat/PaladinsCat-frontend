/** Preserve the former talent directory as an alias of Champion Loadouts. */
import { redirect } from "next/navigation";

/** Redirect the duplicate talent directory to its canonical statistics owner. */
export default function LegacyTalentStatsPage() {
  redirect("/stats/loadouts");
}
