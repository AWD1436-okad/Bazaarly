import { NextResponse } from "next/server";

import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const formData = await request.formData();
  const usernameOrEmail = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!usernameOrEmail || !password) {
    return NextResponse.redirect(
      new URL("/login?error=Enter%20your%20username%20and%20password", request.url),
      303,
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    },
    include: { shop: true },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.redirect(
      new URL("/login?error=Incorrect%20username%20or%20password", request.url),
      303,
    );
  }

  const response = NextResponse.redirect(
    new URL(user.shop ? "/dashboard" : "/onboarding/shop", request.url),
    303,
  );
  const sessionToken = await createSessionToken(user.id);

  response.cookies.set(getSessionCookieName(), sessionToken, getSessionCookieOptions());

  return response;
}
