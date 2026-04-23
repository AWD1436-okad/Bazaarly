import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getLiveStateVersion } from "@/lib/live-state";

export const runtime = "nodejs";
export const preferredRegion = "syd1";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const version = await getLiveStateVersion(user.id);

  return NextResponse.json({
    ok: true,
    version,
    checkedAt: new Date().toISOString(),
  });
}
