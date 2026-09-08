/**
 * Redirect registration to /api/auth/oidc/login?intent=create with status 307 using the configured public origin.
 * refs: none
 */
import { NextRequest, NextResponse } from "next/server";

/**
 * Redirect registration to /api/auth/oidc/login?intent=create with status 307 using the configured public origin.
 * refs: doc: documents/02-technical/security/auth.md
 * I/O types: `request: NextRequest -> NextResponse<unknown>`.
 */
export function GET(request: NextRequest) {
  const publicOrigin = process.env.PALADINSCAT_PUBLIC_ORIGIN || new URL(request.url).origin;
  return NextResponse.redirect(new URL("/api/auth/oidc/login?intent=create", publicOrigin), 307);
}
