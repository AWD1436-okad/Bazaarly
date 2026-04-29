import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const SIMULATION_ELIGIBLE_PREFIXES = [
  "/marketplace",
  "/dashboard",
  "/cart",
  "/orders",
  "/notifications",
  "/shop",
] as const;

function shouldTriggerSimulation(request: NextRequest) {
  if (request.method !== "GET") {
    return false;
  }

  const pathname = request.nextUrl.pathname;

  return SIMULATION_ELIGIBLE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest, event: NextFetchEvent) {
  if (shouldTriggerSimulation(request)) {
    const simulationUrl = new URL("/api/simulation", request.url);

    event.waitUntil(
      fetch(simulationUrl, {
        method: "POST",
        cache: "no-store",
        headers: {
          "x-tradex-simulation": "middleware",
        },
      }).catch(() => undefined),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/marketplace/:path*", "/dashboard/:path*", "/cart/:path*", "/orders/:path*", "/notifications/:path*", "/shop/:path*"],
};
