/** The neutral API alias uses the same session-read handler and burst budget. */
import { readAuthSession } from "@/lib/auth-session-read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = readAuthSession;
