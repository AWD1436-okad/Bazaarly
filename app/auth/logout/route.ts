import { NextRequest, NextResponse } from "next/server";

import {
  getSessionCookieOptions,
  getSessionCookieName,
  getSessionUser,
  revokeSessionToken,
} from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function readFormString(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    const response = NextResponse.json({
      ok: true,
      message: "Already logged out",
      redirectTo: "/login",
    });
    response.cookies.set(getSessionCookieName(), "", {
      ...getSessionCookieOptions(),
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  }

  const formData = await request.formData();
  const password = readFormString(formData, "password");

  if (!password || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 403 });
  }

  const sessionToken = request.cookies.get(getSessionCookieName())?.value;

  if (sessionToken) {
    await revokeSessionToken(sessionToken);
  }

  const response = NextResponse.json({
    ok: true,
    message: "Logged out successfully",
    redirectTo: "/login",
  });
  response.cookies.set(getSessionCookieName(), "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
