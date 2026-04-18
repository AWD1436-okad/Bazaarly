import { NextResponse } from "next/server";

import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "bazaarly_session";

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

  response.cookies.set(SESSION_COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
