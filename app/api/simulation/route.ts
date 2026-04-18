import { NextResponse } from "next/server";

import { runMarketSimulation } from "@/lib/simulation";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST() {
  const result = await runMarketSimulation(false);
  return NextResponse.json(result);
}
