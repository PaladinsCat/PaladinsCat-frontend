import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/api/auth/oidc/login?intent=create", request.url), 307);
}
