import { NextResponse } from "next/server";

import { runMarketSimulation } from "@/lib/simulation";

export const runtime = "nodejs";
export const preferredRegion = "syd1";
export const dynamic = "force-dynamic";

function isCronRequest(request: Request) {
  const userAgent = request.headers.get("user-agent")?.toLowerCase() ?? "";
  const authorization = request.headers.get("authorization");
  const cronSecret = process.env.SIMULATION_CRON_SECRET ?? process.env.CRON_SECRET;

  if (cronSecret) {
    return authorization === `Bearer ${cronSecret}`;
  }

  return userAgent.includes("vercel-cron");
}

async function respondToSimulationTick(debug = false) {
  const result = await runMarketSimulation(false, debug);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  return respondToSimulationTick(searchParams.get("debug") === "1");
}

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  return respondToSimulationTick(searchParams.get("debug") === "1");
}
