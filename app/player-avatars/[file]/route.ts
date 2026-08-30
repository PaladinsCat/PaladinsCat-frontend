import { NextResponse } from "next/server";
import {
  parsePlayerAvatarFile,
  playerAvatarUpstreamUrl,
} from "@/lib/player-avatar-proxy";
import { readBodyWithinLimit } from "@/lib/bounded-response-body";

const MAX_AVATAR_BYTES = 512 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const CACHE_CONTROL = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000, immutable";

function errorResponse(status: number): NextResponse {
  return new NextResponse(null, {
    status,
    headers: {
      "Cache-Control": status === 404
        ? "public, max-age=60, s-maxage=300"
        : "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const avatarId = parsePlayerAvatarFile((await params).file);
  if (!avatarId) return errorResponse(404);

  let upstream: Response;
  try {
    upstream = await fetch(playerAvatarUpstreamUrl(avatarId), {
      cache: "force-cache",
      next: { revalidate: 604_800 },
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
      headers: { Accept: "image/png,image/jpeg,image/webp" },
    });
  } catch {
    return errorResponse(502);
  }

  if (!upstream.ok) return errorResponse(upstream.status === 404 ? 404 : 502);

  const contentType = (upstream.headers.get("content-type") ?? "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) return errorResponse(502);

  const declaredLength = Number(upstream.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_AVATAR_BYTES) {
    return errorResponse(502);
  }

  let body: Uint8Array | null;
  try {
    body = await readBodyWithinLimit(upstream.body, MAX_AVATAR_BYTES);
  } catch {
    return errorResponse(502);
  }
  if (!body) {
    return errorResponse(502);
  }

  const responseBody = new ArrayBuffer(body.byteLength);
  new Uint8Array(responseBody).set(body);

  return new NextResponse(responseBody, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "Content-Length": String(body.byteLength),
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
