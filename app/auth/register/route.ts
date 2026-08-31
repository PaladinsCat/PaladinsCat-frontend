/**
 * Define the auth register route responsibility boundary.
 * Coordinates auth register route data loading, authorization, and presentation.
 */
import { NextRequest, NextResponse } from "next/server";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export function GET(request: NextRequest) {
  const publicOrigin = process.env.PALADINSCAT_PUBLIC_ORIGIN || new URL(request.url).origin;
  return NextResponse.redirect(new URL("/api/auth/oidc/login?intent=create", publicOrigin), 307);
}
