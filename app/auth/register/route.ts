import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const publicOrigin = process.env.PALADINSCAT_PUBLIC_ORIGIN || new URL(request.url).origin;
  return NextResponse.redirect(new URL("/api/auth/oidc/login?intent=create", publicOrigin), 307);
}
