import { NextResponse } from "next/server";

/** Legacy `?id=` URLs → path-based proxy (Netlify caches query-less). */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "GIF unavailable." }, { status: 404 });
  }
  return NextResponse.redirect(
    new URL(`/api/exercises/gif/${encodeURIComponent(id)}`, request.url),
    308,
  );
}
