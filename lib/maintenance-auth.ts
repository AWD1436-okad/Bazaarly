import { NextResponse } from "next/server";

export function verifyMaintenanceRequest(request: Request) {
  const secret = process.env.MAINTENANCE_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Maintenance secret is not configured" },
      { status: 503 },
    );
  }

  const expected = `Bearer ${secret}`;
  if (request.headers.get("authorization") !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
