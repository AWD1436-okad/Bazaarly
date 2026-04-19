import { NextRequest, NextResponse } from "next/server";

import {
  getSessionCookieName,
  revokeSessionToken,
} from "@/lib/auth";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(getSessionCookieName())?.value;

  if (sessionToken) {
    await revokeSessionToken(sessionToken);
  }

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.delete(getSessionCookieName());
  return response;
}
