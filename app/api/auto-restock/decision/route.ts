import { AutoRestockRequestStatus, NotificationType, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { verifyPassword } from "@/lib/password";
import { verifyBankNumber, verifyCheckoutPin } from "@/lib/pin";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";
import { sanitizeStockCount } from "@/lib/stock";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

async function restockIntoInventoryAndListing(
  tx: Prisma.TransactionClient,
  userId: string,
  listingId: string,
  productId: string,
  quantity: number,
  unitPrice: number,
) {
  const listing = await tx.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      shop: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!listing || listing.shop.ownerId !== userId) {
    return false;
  }

  const inventory = await tx.inventory.upsert({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    update: {},
    create: {
      userId,
      productId,
      quantity: 0,
      allocatedQuantity: 0,
      averageUnitCost: 0,
    },
    select: {
      id: true,
      quantity: true,
      allocatedQuantity: true,
      averageUnitCost: true,
    },
  });

  const nextInventoryQuantity = inventory.quantity + quantity;
  const nextAllocatedQuantity = sanitizeStockCount(inventory.allocatedQuantity + quantity);
  const currentValue = inventory.averageUnitCost * inventory.quantity;
  const nextValue = currentValue + unitPrice * quantity;
  const nextAverage = nextInventoryQuantity > 0 ? Math.round(nextValue / nextInventoryQuantity) : unitPrice;

  await tx.inventory.update({
    where: { id: inventory.id },
    data: {
      quantity: {
        increment: quantity,
      },
      allocatedQuantity: nextAllocatedQuantity,
      averageUnitCost: nextAverage,
    },
  });

  await tx.listing.update({
    where: { id: listingId },
    data: {
      quantity: {
        increment: quantity,
      },
      active: true,
      lastAutoRestockedAt: new Date(),
      soldOutAt: null,
    },
  });

  return true;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
  }
  if (!hasCompletedSecuritySetup(user)) {
    return NextResponse.json({ ok: false, error: "Complete security setup first" }, { status: 403 });
  }

  const formData = await request.formData();
  const requestId = String(formData.get("requestId") ?? "");
  const action = String(formData.get("action") ?? "");
  const currencyCode = await getActiveCurrencyCode(user.id);

  if (!requestId) {
    return NextResponse.json({ ok: false, error: "Missing request id" }, { status: 400 });
  }

  const pending = await prisma.autoRestockRequest.findFirst({
    where: {
      id: requestId,
      userId: user.id,
      status: AutoRestockRequestStatus.PENDING,
    },
    include: {
      items: true,
    },
  });

  if (!pending) {
    return NextResponse.json({ ok: false, error: "No pending restock request found" }, { status: 404 });
  }

  if (action === "skip") {
    if (pending.plan === "MAX") {
      return NextResponse.json({ ok: false, error: "Max plan requests cannot be skipped" }, { status: 400 });
    }

    await prisma.autoRestockRequest.update({
      where: { id: pending.id },
      data: {
        status: AutoRestockRequestStatus.SKIPPED,
        decidedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        message: "Auto Restock request skipped for this cycle.",
      },
    });

    return NextResponse.json({ ok: true, message: "Restock cycle skipped" });
  }

  if (action !== "approve") {
    return NextResponse.json({ ok: false, error: "Invalid restock action" }, { status: 400 });
  }

  const password = String(formData.get("password") ?? "");
  const checkoutPin = String(formData.get("checkoutPin") ?? "");
  const bankNumber = String(formData.get("bankNumber") ?? "");

  const authUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      passwordHash: true,
      checkoutPinHash: true,
      bankNumberHash: true,
    },
  });

  if (
    !authUser ||
    !verifyPassword(password, authUser.passwordHash) ||
    !verifyCheckoutPin(checkoutPin, authUser.checkoutPinHash) ||
    !verifyBankNumber(bankNumber, authUser.bankNumberHash)
  ) {
    return NextResponse.json({ ok: false, error: "Incorrect password, PIN, or bank number" }, { status: 400 });
  }

  const txResult = await prisma.$transaction(async (tx) => {
    const freshRequest = await tx.autoRestockRequest.findUnique({
      where: { id: pending.id },
      include: {
        items: true,
      },
    });

    if (!freshRequest || freshRequest.status !== AutoRestockRequestStatus.PENDING) {
      return { ok: false, error: "Restock request already processed" };
    }

    const freshUser = await tx.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        balance: true,
        autoRestockSubscription: true,
      },
    });

    if (!freshUser) {
      return { ok: false, error: "User not found" };
    }

    let payableTotal = 0;
    const resolved: Array<{ itemId: string; quantity: number; unitPrice: number; lineTotal: number }> = [];

    for (const item of freshRequest.items) {
      const listing = await tx.listing.findUnique({
        where: { id: item.listingId },
        select: {
          id: true,
          productId: true,
          shop: {
            select: {
              ownerId: true,
            },
          },
          product: {
            select: {
              marketState: {
                select: {
                  supplierStock: true,
                  currentSupplierPrice: true,
                },
              },
            },
          },
        },
      });

      if (!listing || listing.shop.ownerId !== user.id) {
        continue;
      }

      const supplierStock = sanitizeStockCount(listing.product.marketState?.supplierStock ?? 0);
      if (supplierStock <= 0) {
        continue;
      }

      const quantity = Math.min(item.quantity, supplierStock);
      if (quantity <= 0) {
        continue;
      }

      const unitPrice = Math.max(1, listing.product.marketState?.currentSupplierPrice ?? item.unitPrice);
      const lineTotal = unitPrice * quantity;
      payableTotal += lineTotal;
      resolved.push({
        itemId: item.id,
        quantity,
        unitPrice,
        lineTotal,
      });
    }

    if (resolved.length === 0) {
      await tx.autoRestockRequest.update({
        where: { id: freshRequest.id },
        data: {
          status: AutoRestockRequestStatus.FAILED,
          decidedAt: new Date(),
          failureReason: "No supplier stock available",
        },
      });
      return { ok: false, error: "No supplier stock available for this restock" };
    }

    if (freshUser.balance < payableTotal) {
      return { ok: false, error: "Not enough balance for this restock purchase" };
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        balance: {
          decrement: payableTotal,
        },
      },
    });

    for (const item of resolved) {
      const requestItem = freshRequest.items.find((entry) => entry.id === item.itemId);
      if (!requestItem) {
        continue;
      }

      await tx.marketProductState.update({
        where: { productId: requestItem.productId },
        data: {
          supplierStock: {
            decrement: item.quantity,
          },
        },
      });

      await restockIntoInventoryAndListing(
        tx,
        user.id,
        requestItem.listingId,
        requestItem.productId,
        item.quantity,
        item.unitPrice,
      );
    }

    await tx.autoRestockRequest.update({
      where: { id: freshRequest.id },
      data: {
        status: AutoRestockRequestStatus.COMPLETED,
        decidedAt: new Date(),
        completedAt: new Date(),
        estimatedCostCents: payableTotal,
      },
    });

    await tx.autoRestockSubscription.updateMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
      data: {
        lastRestockAt: new Date(),
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        message: `Auto Restock purchase completed for ${formatCurrency(payableTotal, currencyCode)}.`,
      },
    });

    return { ok: true, totalCost: payableTotal };
  });

  if (!txResult.ok) {
    return NextResponse.json({ ok: false, error: txResult.error }, { status: 400 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/supplier");
  revalidatePath("/settings");
  revalidatePath("/marketplace");
  revalidatePath("/notifications");

  return NextResponse.json({ ok: true, message: "Auto Restock purchase completed" });
}
