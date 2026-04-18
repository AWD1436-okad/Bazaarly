import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clamp } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const cartItemId = String(formData.get("cartItemId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      cart: true,
      listing: true,
    },
  });

  if (!cartItem || cartItem.cart.userId !== user.id) {
    return NextResponse.redirect(new URL("/cart", request.url));
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
  return NextResponse.redirect(new URL("/cart", request.url));
}
