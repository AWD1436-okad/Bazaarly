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
    return NextResponse.redirect(new URL("/dashboard?error=Enter%20a%20valid%20listing", request.url), 303);
  }

  const listingId = listingIdResult.data;

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
      return;
    }

    await tx.listing.update({
      where: { id: listing.id },
      data: {
        active: false,
        quantity: 0,
      },
    });

    const inventory = await tx.inventory.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: listing.productId,
        },
      },
    });

    if (inventory) {
      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          allocatedQuantity: {
            decrement: listing.quantity,
          },
        },
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
