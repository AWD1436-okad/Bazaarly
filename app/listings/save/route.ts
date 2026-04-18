import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { parseCurrencyInput } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!user.shop) {
    return NextResponse.redirect(new URL("/onboarding/shop", request.url));
  }
  const shop = user.shop;

  const formData = await request.formData();
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const priceCents = parseCurrencyInput(String(formData.get("price") ?? ""));

  if (!Number.isInteger(quantity) || quantity <= 0 || !priceCents || priceCents <= 0) {
    return NextResponse.redirect(
      new URL("/dashboard?error=Enter%20a%20valid%20price%20and%20quantity", request.url),
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId,
          },
        },
        include: {
          product: true,
        },
      });

      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      const listing = await tx.listing.findUnique({
        where: {
          shopId_productId: {
            shopId: shop.id,
            productId,
          },
        },
      });

      const currentlyAllocated = inventory.allocatedQuantity - (listing?.quantity ?? 0);
      const maxListable = inventory.quantity - currentlyAllocated;

      if (quantity > maxListable) {
        throw new Error("Listing quantity exceeds available inventory");
      }

      if (listing) {
        await tx.listing.update({
          where: { id: listing.id },
          data: {
            price: priceCents,
            quantity,
            active: quantity > 0,
          },
        });
      } else {
        await tx.listing.create({
          data: {
            shopId: shop.id,
            productId,
            price: priceCents,
            quantity,
            active: true,
          },
        });
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          allocatedQuantity: currentlyAllocated + quantity,
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          message: `${inventory.product.name} is now live in your shop.`,
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Listing update failed";
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(message)}`, request.url),
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  return NextResponse.redirect(new URL("/dashboard?listingSuccess=1", request.url));
}
