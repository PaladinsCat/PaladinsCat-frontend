/**
 * Stream evidence-list reads and multipart submissions to the internal API.
 * The normal Next rewrite has a short upstream-response timeout. AVIF
 * generation is intentionally synchronous before a report is made durable, so
 * a valid five-image upload can exceed that proxy window. This focused route
 * preserves the request stream and applies only to the evidence collection;
 * every other API route continues to use the shared rewrite.
 * refs: endpoints: POST /cheaters/evidence · endpoints: GET /cheaters/evidence · migrations: 166
 */
import { NextRequest, NextResponse } from "next/server";

/**
 * Select the Node.js runtime for this route handler.
 * refs: none
 */
export const runtime = "nodejs";
/**
 * Allow up to 180 seconds for the evidence proxy request.
 * refs: none
 */
export const maxDuration = 180;

const FORWARDED_REQUEST_HEADERS = ["accept", "authorization", "content-type", "x-csrf-token"] as const;
const FORWARDED_RESPONSE_HEADERS = ["cache-control", "content-type"] as const;

/** Resolve the backend base address from the server-only runtime setting. */
function backendBase(): string {
  return (process.env.NEXT_SERVER_API_URL || "http://localhost:3005").replace(/\/$/, "");
}

/** Copy the narrow header allowlist required by evidence reads and uploads. */
function forwardRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

/** Relay the collection endpoint without buffering multipart image bytes. */
async function forwardEvidence(request: NextRequest): Promise<NextResponse> {
  const target = new URL(`${backendBase()}/cheaters/evidence`);
  target.search = request.nextUrl.search;
  const init: RequestInit & { duplex: "half" } = {
    method: request.method,
    headers: forwardRequestHeaders(request),
    cache: "no-store",
    duplex: "half",
    ...(request.method === "GET" ? {} : { body: request.body }),
  };
  try {
    const upstream = await fetch(target, init);
    const headers = new Headers();
    for (const name of FORWARDED_RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch {
    return new NextResponse("Evidence service is unavailable", { status: 502 });
  }
}

/**
 * Proxy evidence reads to the backend through forwardEvidence, preserving the request query and the backend response status.
 * I/O types: `request: NextRequest -> Promise<NextResponse>`.
 * refs: none
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return forwardEvidence(request);
}

/**
 * Proxy evidence submissions, including multipart bodies, to the backend through forwardEvidence; forward session and CSRF context and preserve the backend response status.
 * I/O types: `request: NextRequest -> Promise<NextResponse>`.
 * refs: none
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return forwardEvidence(request);
}
