import { permanentRedirect } from "next/navigation";

export default function CleanPlayerActivityPage() {
  permanentRedirect("/stats/activity");
}
