import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Legacy endpoint retained for older clients. All active plans now auto-buy eligible restocks.
export async function POST() {
  return NextResponse.json(
    { ok: true, message: "Auto Restocker already buys eligible stock automatically." },
  );
}
