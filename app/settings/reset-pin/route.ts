import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST() {
  return NextResponse.json({ ok: false, error: "PINs are no longer used." }, { status: 410 });
}
