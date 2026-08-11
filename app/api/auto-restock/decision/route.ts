import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Compatibility endpoint for older clients. Plans now pay and restock automatically.
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Auto Restocker now buys eligible stock automatically." },
    { status: 410 },
  );
}
