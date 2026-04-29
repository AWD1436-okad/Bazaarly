import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function isAsyncRequest(request: Request) {
  return request.headers.get("x-tradex-async") === "1";
}

function getPassword(formData: FormData) {
  const rawValue = formData.get("password");
  return typeof rawValue === "string" ? rawValue.trim() : "";
}

export async function POST(request: Request) {
  const asyncRequest = isAsyncRequest(request);
  const user = await getSessionUser();

  if (!user) {
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }
  if (!hasCompletedSecuritySetup(user)) {
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: "Complete security setup first" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/security-setup", request.url), 303);
  }

  if (!user.shop) {
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: "Shop setup required" }, { status: 400 });
    }
    return NextResponse.redirect(new URL("/onboarding/shop", request.url), 303);
  }

  const formData = await request.formData();
  const password = getPassword(formData);

  if (!password) {
    if (asyncRequest) {
      return NextResponse.json(
        { ok: false, error: "Enter your password to continue" },
        { status: 400 },
      );
    }
    return NextResponse.redirect(
      new URL("/dashboard?error=Enter%20your%20password%20to%20continue", request.url),
      303,
    );
  }

  const passwordMatches = verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 403 });
    }
    return NextResponse.redirect(
      new URL("/dashboard?error=Incorrect%20password", request.url),
      303,
    );
  }

  const result = await prisma.listing.deleteMany({
    where: {
      shopId: user.shop.id,
      quantity: { lte: 0 },
    },
  });

  if (result.count === 0) {
    if (asyncRequest) {
      return NextResponse.json(
        { ok: false, error: "No sold-out listings to remove" },
        { status: 400 },
      );
    }
    return NextResponse.redirect(
      new URL("/dashboard?error=No%20sold-out%20listings%20to%20remove", request.url),
      303,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  revalidatePath(`/shop/${user.shop.id}`);

  if (asyncRequest) {
    return NextResponse.json({
      ok: true,
      deletedCount: result.count,
      message: "Sold-out listings removed successfully",
    });
  }

  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
