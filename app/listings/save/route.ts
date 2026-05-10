import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { convertCurrencyInputToAudCents } from "@/lib/money";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";
import { parseRouteId } from "@/lib/route-validation";
import { sanitizeStockCount } from "@/lib/stock";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function isAsyncRequest(request: Request) {
  return request.headers.get("x-profit-planet-async") === "1";
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
  const shop = user.shop;

  const formData = await request.formData();
  const productIdResult = parseRouteId(formData, "productId");
  const listingIdResult = parseRouteId(formData, "listingId");
  const priceInput = String(formData.get("price") ?? "").trim();

  if ((!productIdResult.success && !listingIdResult.success) || !/^\d+(\.\d{1,2})?$/.test(priceInput)) {
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

  const productId = productIdResult.success ? productIdResult.data : null;
  const listingId = listingIdResult.success ? listingIdResult.data : null;
  const currencyCode = await getActiveCurrencyCode(user.id);
  const priceCents = convertCurrencyInputToAudCents(priceInput, currencyCode);

  if (!priceCents || priceCents <= 0 || priceCents > 1_000_000) {
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

  let successMessage = "Listing published successfully";

  try {
    await prisma.$transaction(async (tx) => {
      if (listingId) {
        const listing = await tx.listing.findFirst({
          where: {
            id: listingId,
            shop: {
              ownerId: user.id,
            },
          },
          include: {
            product: true,
          },
        });

        if (!listing) {
          throw new Error("Listing not found");
        }

        await tx.listing.update({
          where: { id: listing.id },
          data: {
            price: priceCents,
            currencyCode: "AUD",
          },
        });

        await tx.notification.create({
          data: {
            userId: user.id,
            type: NotificationType.SYSTEM,
            message: `${listing.product.name} price updated.`,
          },
        });
        successMessage = "Price saved successfully";
        return;
      }

      if (!productId) {
        throw new Error("Enter a valid product and price");
      }

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

      const inventoryQuantity = sanitizeStockCount(inventory.quantity);
      const allocatedQuantity = sanitizeStockCount(inventory.allocatedQuantity);
      const quantityToList = sanitizeStockCount(inventoryQuantity - allocatedQuantity);

      if (quantityToList <= 0) {
        if (listing) {
          await tx.listing.update({
            where: { id: listing.id },
            data: {
              price: priceCents,
              currencyCode: "AUD",
            },
          });

          await tx.notification.create({
            data: {
              userId: user.id,
              type: NotificationType.SYSTEM,
              message: `${inventory.product.name} price updated.`,
            },
          });
          successMessage = "Price saved successfully";
          return;
        }

        throw new Error(
          inventoryQuantity <= 0
            ? "Buy this item from the supplier before listing it."
            : "All your stock for this item is already listed.",
        );
      }

      const existingListingQuantity = sanitizeStockCount(listing?.quantity);
      const nextListingQuantity = sanitizeStockCount(existingListingQuantity + quantityToList);

      if (listing) {
        await tx.listing.update({
          where: { id: listing.id },
          data: {
            price: priceCents,
            currencyCode: "AUD",
            quantity: nextListingQuantity,
            active: nextListingQuantity > 0,
            isPaused: false,
            soldOutAt: nextListingQuantity > 0 ? null : listing.soldOutAt,
          },
        });
      } else {
        await tx.listing.create({
          data: {
            shopId: shop.id,
            productId,
            price: priceCents,
            currencyCode: "AUD",
            quantity: quantityToList,
            active: true,
            isPaused: false,
            soldOutAt: null,
          },
        });
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          allocatedQuantity: sanitizeStockCount(allocatedQuantity + quantityToList),
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
  revalidatePath(`/shop/${shop.id}`);
  if (asyncRequest) {
    return NextResponse.json({ ok: true, message: successMessage });
  }
  return NextResponse.redirect(new URL("/dashboard?listingSuccess=1", request.url), 303);
}
