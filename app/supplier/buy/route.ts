import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePositiveQuantity, parseRouteId } from "@/lib/route-validation";
import { sanitizeStockCount } from "@/lib/stock";

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

  const formData = await request.formData();
  const productIdResult = parseRouteId(formData, "productId");
  const quantityResult = parsePositiveQuantity(formData, "quantity");

  if (!productIdResult.success || !quantityResult.success) {
    if (asyncRequest) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid product and quantity" },
        { status: 400 },
      );
    }
    return NextResponse.redirect(
      new URL("/dashboard/supplier?error=Enter%20a%20valid%20product%20and%20quantity", request.url),
      303,
    );
  }

  const productId = productIdResult.data;
  const quantity = quantityResult.data;

  try {
    let restockedListing = false;
    let purchasedProductName = "";
    let purchaseTotalCost = 0;

    await prisma.$transaction(async (tx) => {
      const buyer = await tx.user.findUnique({
        where: { id: user.id },
      });

      const product = await tx.product.findUnique({
        where: { id: productId },
        include: {
          marketState: true,
        },
      });

      if (!buyer || !product || !product.marketState) {
        throw new Error("Supplier product is not available");
      }

      if (product.marketState.supplierStock < quantity) {
        throw new Error("Supplier stock changed");
      }

      const unitCost = product.marketState.currentSupplierPrice;
      const totalCost = unitCost * quantity;
      purchasedProductName = product.name;
      purchaseTotalCost = totalCost;

      if (buyer.balance < totalCost) {
        throw new Error("Not enough balance");
      }

      const inventory = await tx.inventory.findUnique({
        where: {
          userId_productId: {
            userId: buyer.id,
            productId: product.id,
          },
        },
      });

      const existingListing = await tx.listing.findUnique({
        where: {
          shopId_productId: {
            shopId: user.shop?.id ?? "",
            productId: product.id,
          },
        },
      });

      const combinedQuantity = sanitizeStockCount((inventory?.quantity ?? 0) + quantity);
      const weightedCostTotal =
        (inventory?.averageUnitCost ?? 0) * (inventory?.quantity ?? 0) + unitCost * quantity;
      const nextAverageCost =
        combinedQuantity > 0 ? Math.round(weightedCostTotal / combinedQuantity) : unitCost;
      const shouldRestockExistingListing = Boolean(user.shop?.id) && Boolean(existingListing);
      const nextAllocatedQuantity = sanitizeStockCount(
        (inventory?.allocatedQuantity ?? 0) + (shouldRestockExistingListing ? quantity : 0),
      );

      await tx.user.update({
        where: { id: buyer.id },
        data: {
          balance: {
            decrement: totalCost,
          },
        },
      });

      await tx.marketProductState.update({
        where: { productId: product.id },
        data: {
          supplierStock: {
            decrement: quantity,
          },
        },
      });

      if (inventory) {
        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: {
              increment: quantity,
            },
            allocatedQuantity: nextAllocatedQuantity,
            averageUnitCost: nextAverageCost,
          },
        });
      } else {
        await tx.inventory.create({
          data: {
            userId: buyer.id,
            productId: product.id,
            quantity,
            allocatedQuantity: shouldRestockExistingListing ? quantity : 0,
            averageUnitCost: nextAverageCost,
          },
        });
      }

      if (shouldRestockExistingListing && existingListing) {
        await tx.listing.update({
          where: { id: existingListing.id },
          data: {
            quantity: {
              increment: quantity,
            },
            active: true,
          },
        });

        restockedListing = true;
      }

      await tx.notification.create({
        data: {
          userId: buyer.id,
          type: NotificationType.SYSTEM,
          message: restockedListing
            ? `Bought ${quantity}x ${product.name} from Supplier for $${(totalCost / 100).toFixed(2)} and restocked your listing.`
            : `Bought ${quantity}x ${product.name} from Supplier for $${(totalCost / 100).toFixed(2)}.`,
        },
      });
    });

    revalidatePath("/dashboard/supplier");
    revalidatePath("/dashboard");
    revalidatePath("/marketplace");

    if (asyncRequest) {
      return NextResponse.json({
        ok: true,
        restockedListing,
        productName: purchasedProductName,
        totalCost: purchaseTotalCost,
      });
    }

    const redirectUrl = new URL("/dashboard/supplier?purchase=1", request.url);
    if (restockedListing) {
      redirectUrl.searchParams.set("restocked", "1");
    }
    return NextResponse.redirect(redirectUrl, 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supplier purchase failed";
    if (asyncRequest) {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    return NextResponse.redirect(
      new URL(`/dashboard/supplier?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }
}
