import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function rendererUrl() {
  return (process.env.PALADINSCAT_RENDER_URL ?? "http://127.0.0.1:3020").replace(/\/$/, "");
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^\d{1,20}$/.test(id)) return new Response("Invalid player ID.", { status: 400 });

  try {
    const response = await fetch(`${rendererUrl()}/preview/player/${id}`, { cache: "no-store" });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      return new Response(body?.error ?? "The Discord preview is unavailable.", { status: response.status });
    }
    return new Response(await response.arrayBuffer(), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch {
    return new Response("Start the PaladinsCat Discord bot to view this preview.", { status: 503 });
  }
}
