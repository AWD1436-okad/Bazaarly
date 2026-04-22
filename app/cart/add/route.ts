import { Prisma } from "@prisma/client";
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
  try {
    await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({
        where: { id: listingId },
        include: {
          shop: true,
          product: true,
        },
      });

      if (!listing || !listing.active || listing.quantity < quantity) {
        throw new Error("Listing is not available");
      }

      if (listing.shop.ownerId === user.id) {
        throw new Error("You cannot buy from your own shop");
      }

      let cart = await tx.cart.findFirst({
        where: {
          userId: user.id,
          status: "ACTIVE",
        },
        orderBy: [{ updatedAt: "desc" }],
      });

      if (!cart) {
        try {
          cart = await tx.cart.create({
            data: {
              userId: user.id,
              shopId: listing.shopId,
            },
          });
        } catch (error) {
          if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
            throw error;
          }

          cart = await tx.cart.findFirst({
            where: {
              userId: user.id,
              status: "ACTIVE",
            },
            orderBy: [{ updatedAt: "desc" }],
          });
        }
      }

      if (!cart) {
        throw new Error("Unable to open your cart right now");
      }

      if (cart.shopId && cart.shopId !== listing.shopId) {
        throw new Error("Checkout is single-seller for this version");
      }

      if (!cart.shopId) {
        cart = await tx.cart.update({
          where: { id: cart.id },
          data: {
            shopId: listing.shopId,
          },
        });
      }

      const cartItem = await tx.cartItem.findUnique({
        where: {
          cartId_listingId: {
            cartId: cart.id,
            listingId: listing.id,
          },
        },
      });

      const nextQuantity = (cartItem?.quantity ?? 0) + quantity;

      if (nextQuantity > listing.quantity) {
        throw new Error("Not enough stock for that quantity");
      }

      if (cartItem) {
        await tx.cartItem.update({
          where: { id: cartItem.id },
          data: {
            quantity: nextQuantity,
            unitPriceSnapshot: listing.price,
          },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            listingId: listing.id,
            productId: listing.productId,
            quantity,
            unitPriceSnapshot: listing.price,
          },
        });
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add item to cart";
    const redirectPath =
      message === "Checkout is single-seller for this version" || message === "Not enough stock for that quantity"
        ? "/cart"
        : "/marketplace";

    return NextResponse.redirect(
      new URL(`${redirectPath}?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }

  revalidatePath("/cart");
  return NextResponse.redirect(new URL("/cart?added=1", request.url), 303);
}
