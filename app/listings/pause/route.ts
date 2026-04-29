import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRouteId } from "@/lib/route-validation";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function isAsyncRequest(request: Request) {
  return request.headers.get("x-tradex-async") === "1";
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

  const formData = await request.formData();
  const listingIdResult = parseRouteId(formData, "listingId");
  const action = String(formData.get("action") ?? "pause");

  if (!listingIdResult.success) {
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: "Enter a valid listing" }, { status: 400 });
    }
    return NextResponse.redirect(new URL("/dashboard?error=Enter%20a%20valid%20listing", request.url), 303);
  }

  const listingId = listingIdResult.data;

  try {
    await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findFirst({
        where: {
          id: listingId,
          shop: {
            ownerId: user.id,
          },
        },
      });

      if (!listing) {
        throw new Error("Listing not found");
      }

      await tx.listing.update({
        where: { id: listing.id },
        data: {
          isPaused: action === "resume" ? false : true,
          active: listing.quantity > 0,
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Listing update failed";
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  if (asyncRequest) {
    return NextResponse.json({ ok: true, action });
  }
  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
