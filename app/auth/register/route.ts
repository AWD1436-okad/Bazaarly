import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

// Legacy form endpoint: the public app now starts through the shop-name entry flow.
export async function POST(request: Request) {
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
