import { CartStatus, ShopStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  getSessionCookieName,
  getSessionCookieOptions,
  getSessionUser,
  hasCompletedSecuritySetup,
} from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function readFormString(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
  }
  if (!hasCompletedSecuritySetup(user)) {
    return NextResponse.json({ ok: false, error: "Complete security setup first" }, { status: 403 });
  }

  const formData = await request.formData();
  const username = readFormString(formData, "username").toLowerCase();
  const password = readFormString(formData, "password");
  const confirmation = readFormString(formData, "confirmation");

  if (username !== user.username.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Username does not match" }, { status: 403 });
  }

  if (!password || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 403 });
  }

  if (confirmation !== "DELETE") {
    return NextResponse.json({ ok: false, error: "Type DELETE to confirm" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        deletedAt: new Date(),
        hasCompletedOnboarding: false,
      },
    });

    await tx.session.deleteMany({
      where: { userId: user.id },
    });

    await tx.cart.updateMany({
      where: {
        userId: user.id,
        status: CartStatus.ACTIVE,
      },
      data: {
        status: CartStatus.ABANDONED,
      },
    });

    if (user.shop) {
      await tx.shop.update({
        where: { id: user.shop.id },
        data: {
          status: ShopStatus.INACTIVE,
        },
      });

      await tx.listing.updateMany({
        where: { shopId: user.shop.id },
        data: {
          active: false,
        },
      });

      await tx.cart.updateMany({
        where: {
          shopId: user.shop.id,
          status: CartStatus.ACTIVE,
        },
        data: {
          status: CartStatus.ABANDONED,
        },
      });
    }
  });

  const response = NextResponse.json({
    ok: true,
    message: "Account deleted successfully",
    redirectTo: "/login?deleted=1",
  });

  response.cookies.set(getSessionCookieName(), "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
