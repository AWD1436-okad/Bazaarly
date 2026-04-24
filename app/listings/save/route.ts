import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePriceInput, parseRouteId } from "@/lib/route-validation";
import { getFreeInventoryQuantity, sanitizeStockCount } from "@/lib/stock";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function isAsyncRequest(request: Request) {
  return request.headers.get("x-bazaarly-async") === "1";
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
  if (!user.shop) {
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: "Shop setup required" }, { status: 400 });
    }
    return NextResponse.redirect(new URL("/onboarding/shop", request.url), 303);
  }
  const shop = user.shop;

  const formData = await request.formData();
  const productIdResult = parseRouteId(formData, "productId");
  const priceResult = parsePriceInput(formData, "price");

  if (!productIdResult.success || !priceResult.success) {
    if (asyncRequest) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid product and price" },
        { status: 400 },
      );
    }
    return NextResponse.redirect(
      new URL("/dashboard?error=Enter%20a%20valid%20product%20and%20price", request.url),
      303,
    );
  }

  const productId = productIdResult.data;
  const priceCents = priceResult.data;

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

      const quantityToList = getFreeInventoryQuantity(
        inventory.quantity,
        inventory.allocatedQuantity,
      );

      if (quantityToList <= 0) {
        throw new Error("No free inventory is available to list");
      }

      const nextListingQuantity = sanitizeStockCount((listing?.quantity ?? 0) + quantityToList);

      if (listing) {
        await tx.listing.update({
          where: { id: listing.id },
          data: {
            price: priceCents,
            quantity: nextListingQuantity,
            active: nextListingQuantity > 0,
          },
        });
      } else {
        await tx.listing.create({
          data: {
            shopId: shop.id,
            productId,
            price: priceCents,
            quantity: quantityToList,
            active: true,
          },
        });
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          allocatedQuantity: sanitizeStockCount(inventory.allocatedQuantity + quantityToList),
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
    return NextResponse.json({ ok: true, message: "Listing published successfully" });
  }
  return NextResponse.redirect(new URL("/dashboard?listingSuccess=1", request.url), 303);
}
