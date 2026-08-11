import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Compatibility endpoint for older clients. Auto Restocker no longer creates approval requests.
export async function GET() {
  return NextResponse.json({ pending: null });
}
