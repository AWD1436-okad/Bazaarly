import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function isAsyncRequest(request: Request) {
  return request.headers.get("x-tradex-async") === "1";
}

function readAction(formData: FormData) {
  const action = String(formData.get("action") ?? "").trim();
  return action === "pause" || action === "resume" ? action : null;
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
  const action = readAction(formData);

  if (!action) {
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: "Choose pause or resume" }, { status: 400 });
    }
    return NextResponse.redirect(new URL("/dashboard?error=Choose%20pause%20or%20resume", request.url), 303);
  }

  const shouldResume = action === "resume";
  const result = await prisma.listing.updateMany({
    where: {
      shopId: user.shop.id,
      quantity: { gt: 0 },
      active: shouldResume ? false : true,
    },
    data: {
      active: shouldResume,
    },
  });

  if (result.count > 0) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        message: shouldResume
          ? `${result.count} listing${result.count === 1 ? "" : "s"} resumed in your shop.`
          : `${result.count} listing${result.count === 1 ? "" : "s"} paused in your shop.`,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/marketplace");

  if (asyncRequest) {
    return NextResponse.json({
      ok: true,
      count: result.count,
      message:
        result.count === 0
          ? shouldResume
            ? "No paused listings to resume"
            : "No active listings to pause"
          : shouldResume
            ? "All paused listings resumed"
            : "All active listings paused",
    });
  }

  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
