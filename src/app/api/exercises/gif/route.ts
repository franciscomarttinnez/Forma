import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  id: z.string().min(2).max(40),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { id } = querySchema.parse({ id: searchParams.get("id") ?? "" });

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
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load the GIF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
