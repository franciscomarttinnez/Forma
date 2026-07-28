import { NextResponse } from "next/server";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().min(2).max(40),
});

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = paramsSchema.parse(await params);

    const upstream = await fetch(
      `https://static.exercisedb.dev/media/${encodeURIComponent(id)}.gif`,
      {
        headers: { Accept: "image/gif,*/*" },
        next: { revalidate: 60 * 60 * 24 * 7 },
      },
    );

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: "GIF unavailable." },
        { status: 404 },
      );
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "image/gif",
        // Path includes the exercise id, so CDN cache keys stay unique on Netlify
        "Cache-Control": "public, max-age=604800, immutable",
        "Netlify-CDN-Cache-Control":
          "public, s-maxage=604800, durable, immutable",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load the GIF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
