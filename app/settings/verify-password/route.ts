import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
  }
  if (!hasCompletedSecuritySetup(user)) {
    return NextResponse.json({ ok: false, error: "Complete security setup first" }, { status: 403 });
  }

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "").trim();

  if (!password || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
