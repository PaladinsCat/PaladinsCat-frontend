/** Preserve backend session decisions and stop excessive reads from legacy tabs. */
import { readAuthSession } from "@/lib/auth-session-read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = readAuthSession;
