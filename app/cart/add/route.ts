import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clamp } from "@/lib/utils";
import { parsePositiveQuantity, parseRouteId } from "@/lib/route-validation";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const listingIdResult = parseRouteId(formData, "listingId");
  const quantityResult = parsePositiveQuantity(formData, "quantity");

  if (!listingIdResult.success || !quantityResult.success) {
    return NextResponse.redirect(
      new URL("/marketplace?error=Enter%20a%20valid%20listing%20and%20quantity", request.url),
      303,
    );
  }

  const listingId = listingIdResult.data;
  const quantity = clamp(quantityResult.data, 1, 99);

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      shop: true,
      product: true,
    },
  });

  if (!listing || !listing.active || listing.quantity < quantity) {
    return NextResponse.redirect(
      new URL("/marketplace?error=Listing%20is%20not%20available", request.url),
      303,
    );
  }

  if (listing.shop.ownerId === user.id) {
    return NextResponse.redirect(
      new URL("/marketplace?error=You%20cannot%20buy%20from%20your%20own%20shop", request.url),
      303,
    );
  }

  const existingCart = await prisma.cart.findFirst({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
  });

  if (existingCart && existingCart.shopId && existingCart.shopId !== listing.shopId) {
    return NextResponse.redirect(
      new URL("/cart?error=Checkout%20is%20single-seller%20for%20this%20version", request.url),
      303,
    );
  }

  const cart =
    existingCart ??
    (await prisma.cart.create({
      data: {
        userId: user.id,
        shopId: listing.shopId,
      },
    }));

  const cartItem = await prisma.cartItem.findUnique({
    where: {
      cartId_listingId: {
        cartId: cart.id,
        listingId: listing.id,
      },
    },
  });

  const nextQuantity = (cartItem?.quantity ?? 0) + quantity;

  if (nextQuantity > listing.quantity) {
    return NextResponse.redirect(
      new URL("/cart?error=Not%20enough%20stock%20for%20that%20quantity", request.url),
      303,
    );
  }

  if (cartItem) {
    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: {
        quantity: nextQuantity,
        unitPriceSnapshot: listing.price,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        listingId: listing.id,
        productId: listing.productId,
        quantity,
        unitPriceSnapshot: listing.price,
      },
    });
  }

  revalidatePath("/cart");
  return NextResponse.redirect(new URL("/cart?added=1", request.url), 303);
}
