import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

// Player modes are no longer part of the game experience.
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Player modes are no longer available." },
    { status: 410 },
  );
}
