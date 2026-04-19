import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clamp } from "@/lib/utils";
import { parseNonNegativeQuantity, parseRouteId } from "@/lib/route-validation";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const cartItemIdResult = parseRouteId(formData, "cartItemId");
  const quantityResult = parseNonNegativeQuantity(formData, "quantity");

  if (!cartItemIdResult.success || !quantityResult.success) {
    return NextResponse.redirect(new URL("/cart?error=Enter%20a%20valid%20cart%20quantity", request.url), 303);
  }

  const cartItemId = cartItemIdResult.data;
  const quantity = quantityResult.data;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      cart: true,
      listing: true,
    },
  });

  if (!cartItem || cartItem.cart.userId !== user.id) {
    return NextResponse.redirect(new URL("/cart", request.url), 303);
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  } else {
    const safeQuantity = clamp(quantity, 1, cartItem.listing.quantity);
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        quantity: safeQuantity,
        unitPriceSnapshot: cartItem.listing.price,
      },
    });
  }

  revalidatePath("/cart");
  return NextResponse.redirect(new URL("/cart", request.url), 303);
}
