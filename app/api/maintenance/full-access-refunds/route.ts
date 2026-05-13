import { NextResponse } from "next/server";

import { refundFullAccessSurcharges } from "@/lib/full-access-refunds";
import { verifyMaintenanceRequest } from "@/lib/maintenance-auth";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const unauthorized = verifyMaintenanceRequest(request);
  if (unauthorized) return unauthorized;

  const result = await refundFullAccessSurcharges();
  return NextResponse.json({ ok: true, ...result });
}
