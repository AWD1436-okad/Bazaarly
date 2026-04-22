import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRouteId } from "@/lib/route-validation";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const listingIdResult = parseRouteId(formData, "listingId");

  if (!listingIdResult.success) {
    return NextResponse.redirect(
      new URL("/dashboard?error=Enter%20a%20valid%20listing", request.url),
      303,
    );
  }

  const listingId = listingIdResult.data;

  let shopPath = "/dashboard";

  try {
    await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findFirst({
        where: {
          id: listingId,
          shop: {
            ownerId: user.id,
          },
        },
        select: {
          id: true,
          quantity: true,
          shopId: true,
        },
      });

      if (!listing) {
        throw new Error("Listing not found");
      }

      if (listing.quantity > 0) {
        throw new Error("Only sold-out listings can be deleted");
      }

      shopPath = `/shop/${listing.shopId}`;

      await tx.listing.delete({
        where: {
          id: listing.id,
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Listing delete failed";
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  revalidatePath(shopPath);
  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
