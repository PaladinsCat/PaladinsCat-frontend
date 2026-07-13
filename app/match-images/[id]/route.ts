import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function rendererUrl() {
  return (process.env.PALADINSCAT_RENDER_URL ?? "http://127.0.0.1:3020").replace(/\/$/, "");
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^\d{6,20}$/.test(id)) return Response.json({ error: "Invalid match ID." }, { status: 400 });
  try {
    const response = await fetch(`${rendererUrl()}/matches/${id}/image`, { cache: "no-store" });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      return Response.json({ error: body?.error ?? "Could not render this match." }, { status: response.status });
    }
    return new Response(await response.arrayBuffer(), {
      headers: {
        "content-type": "image/png",
        "cache-control": "private, max-age=60",
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The match image renderer is unavailable." }, { status: 503 });
  }
}
