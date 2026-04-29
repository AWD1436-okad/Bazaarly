import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { convertCurrencyInputToAudCents } from "@/lib/money";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";
import { parseRouteId } from "@/lib/route-validation";
import { getFreeInventoryQuantity, sanitizeStockCount } from "@/lib/stock";

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
  if (!user.shop) {
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: "Shop setup required" }, { status: 400 });
    }
    return NextResponse.redirect(new URL("/onboarding/shop", request.url), 303);
  }
  const shop = user.shop;

  const formData = await request.formData();
  const productIdResult = parseRouteId(formData, "productId");
  const priceInput = String(formData.get("price") ?? "").trim();

  if (!productIdResult.success || !/^\d+(\.\d{1,2})?$/.test(priceInput)) {
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

      const activeListingQuantity = listing?.active ? listing.quantity : 0;
      const quantityToList = getFreeInventoryQuantity(
        inventory.quantity,
        activeListingQuantity,
      );

      if (quantityToList <= 0) {
        throw new Error("No free inventory is available to list");
      }

      const nextListingQuantity = sanitizeStockCount(activeListingQuantity + quantityToList);

      if (listing) {
        await tx.listing.update({
          where: { id: listing.id },
          data: {
            price: priceCents,
            currencyCode: "AUD",
            quantity: nextListingQuantity,
            active: nextListingQuantity > 0,
            isPaused: false,
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
          },
        });
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          allocatedQuantity: nextListingQuantity,
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
