import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  return NextResponse.redirect(new URL("/security-setup", request.url), 303);
}
