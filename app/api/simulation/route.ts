import { NextResponse } from "next/server";

import { runMarketSimulation } from "@/lib/simulation";

export async function POST() {
  const result = await runMarketSimulation(false);
  return NextResponse.json(result);
}
