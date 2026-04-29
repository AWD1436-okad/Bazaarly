import { NotificationType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { verifyPassword } from "@/lib/password";
import { encryptBankNumber, verifyBankNumber, verifyCheckoutPin } from "@/lib/pin";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";
import { isSafePositiveQuantity } from "@/lib/route-validation";
import { getLiveStockStatusMessage, sanitizeStockCount } from "@/lib/stock";
import { clamp } from "@/lib/utils";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

function redirectWithError(request: Request, message: string) {
  return NextResponse.redirect(
    new URL(`/checkout?error=${encodeURIComponent(message)}`, request.url),
    303,
  );
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }
  if (!hasCompletedSecuritySetup(user)) {
    return NextResponse.redirect(new URL("/security-setup", request.url), 303);
  }

  const formData = await request.formData();
  const currencyCode = await getActiveCurrencyCode(user.id);
  const password = String(formData.get("password") ?? "");
  const checkoutPin = String(formData.get("checkoutPin") ?? "").trim();
  const bankNumber = String(formData.get("bankNumber") ?? "").trim();

  const authUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      passwordHash: true,
      checkoutPinHash: true,
      bankNumberHash: true,
      bankNumberEncrypted: true,
    },
  });

  if (
    !authUser ||
    !verifyPassword(password, authUser.passwordHash) ||
    !verifyCheckoutPin(checkoutPin, authUser.checkoutPinHash) ||
    !verifyBankNumber(bankNumber, authUser.bankNumberHash)
  ) {
    return redirectWithError(request, "Incorrect password, PIN, or bank number");
  }

  if (!authUser.bankNumberEncrypted) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        bankNumberEncrypted: encryptBankNumber(bankNumber),
        bankNumberLast4: bankNumber.slice(-4),
      },
    });
  }

  const activeCart = await prisma.cart.findFirst({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (!activeCart) {
    return NextResponse.redirect(new URL("/cart?error=Your%20cart%20is%20empty", request.url), 303);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Cart" WHERE "id" = ${activeCart.id} FOR UPDATE`;

      const cart = await tx.cart.findFirst({
        where: {
          id: activeCart.id,
          userId: user.id,
          status: "ACTIVE",
        },
        include: {
          shop: {
            include: {
              owner: true,
            },
          },
          items: {
            include: {
              product: {
                include: {
                  marketState: true,
                },
              },
              listing: {
                include: {
                  product: true,
                  shop: true,
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("Your cart is empty");
      }

      const buyer = await tx.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          displayName: true,
          balance: true,
        },
      });

      if (!buyer) {
        throw new Error("Buyer not found");
      }

      let totalPrice = 0;
      let marketplaceTotal = 0;
      let supplierTotal = 0;
      const saleSummary: string[] = [];
      const supplierSummary: string[] = [];
      const marketplaceItems: Array<{
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        listing: {
          id: string;
          shopId: string;
          productId: string;
          price: number;
          quantity: number;
          active: boolean;
          product: {
            name: string;
          };
        };
        inventory: {
          id: string;
          quantity: number;
          allocatedQuantity: number;
        };
      }> = [];
      const supplierItems: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }> = [];

      for (const item of cart.items) {
        if (!isSafePositiveQuantity(item.quantity, 999) || !isSafePositiveQuantity(item.unitPriceSnapshot)) {
          throw new Error("Your cart has invalid items. Please refresh and try again");
        }

        if (item.source === "SUPPLIER") {
          if (!item.product.marketState) {
            throw new Error(`${item.product.name} is not available from the supplier`);
          }

          await tx.$queryRaw`SELECT "id" FROM "MarketProductState" WHERE "productId" = ${item.productId} FOR UPDATE`;

          const marketState = await tx.marketProductState.findUnique({
            where: { productId: item.productId },
          });

          if (!marketState || marketState.supplierStock < item.quantity) {
            throw new Error(`${item.product.name} supplier stock changed`);
          }

          if (marketState.currentSupplierPrice !== item.unitPriceSnapshot) {
            throw new Error(`${item.product.name} changed price. Please review your cart and try again`);
          }

          const lineTotal = item.unitPriceSnapshot * item.quantity;
          totalPrice += lineTotal;
          supplierTotal += lineTotal;
          supplierSummary.push(`${item.quantity}x ${item.product.name}`);
          supplierItems.push({
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPriceSnapshot,
            lineTotal,
          });
          continue;
        }

        if (!item.listingId || !item.listing || item.listing.shopId !== cart.shopId) {
          throw new Error("Your cart has invalid marketplace items. Please refresh and try again");
        }

        await tx.$queryRaw`SELECT "id" FROM "Listing" WHERE "id" = ${item.listingId} FOR UPDATE`;

        const listing = await tx.listing.findUnique({
          where: { id: item.listingId },
          include: {
            product: true,
          },
        });

        if (!listing || !listing.active || listing.isPaused || listing.quantity < item.quantity) {
          throw new Error("Listing stock changed");
        }
        if (listing.shopId !== cart.shopId || listing.productId !== item.productId) {
          throw new Error("Cart item no longer matches its listing");
        }
        if (listing.price !== item.unitPriceSnapshot) {
          throw new Error(`${listing.product.name} changed price. Please review your cart and try again`);
        }

        const seller = cart.shop?.owner;
        if (!seller) {
          throw new Error("Seller not found");
        }

        const inventory = await tx.inventory.findUnique({
          where: {
            userId_productId: {
              userId: seller.id,
              productId: item.productId,
            },
          },
          select: {
            id: true,
            quantity: true,
            allocatedQuantity: true,
          },
        });

        if (!inventory || inventory.quantity < item.quantity || inventory.allocatedQuantity < item.quantity) {
          throw new Error(`${listing.product.name} no longer has enough seller stock`);
        }

        await tx.$queryRaw`SELECT "id" FROM "Inventory" WHERE "id" = ${inventory.id} FOR UPDATE`;

        const lineTotal = item.unitPriceSnapshot * item.quantity;
        totalPrice += lineTotal;
        marketplaceTotal += lineTotal;
        saleSummary.push(`${item.quantity}x ${listing.product.name}`);
        marketplaceItems.push({
          quantity: item.quantity,
          unitPrice: item.unitPriceSnapshot,
          lineTotal,
          listing,
          inventory,
        });
      }

      if (buyer.balance < totalPrice) {
        throw new Error("Not enough balance");
      }

      await tx.user.update({
        where: { id: buyer.id },
        data: {
          balance: {
            decrement: totalPrice,
          },
        },
      });

      if (marketplaceItems.length > 0) {
        if (!cart.shop) {
          throw new Error("Seller not found");
        }

        const seller = await tx.user.findUnique({
          where: { id: cart.shop.ownerId },
          select: {
            id: true,
            balance: true,
            currencyCode: true,
          },
        });

        if (!seller) {
          throw new Error("Seller not found");
        }

        const order = await tx.order.create({
          data: {
            buyerId: buyer.id,
            sellerId: seller.id,
            shopId: cart.shopId!,
            totalPrice: marketplaceTotal,
          },
        });

        await tx.user.update({
          where: { id: seller.id },
          data: {
            balance: {
              increment: marketplaceTotal,
            },
          },
        });

        for (const item of marketplaceItems) {
          const remainingListingQuantity = sanitizeStockCount(item.listing.quantity - item.quantity);
          const remainingInventoryQuantity = sanitizeStockCount(item.inventory.quantity - item.quantity);
          const remainingAllocatedQuantity = sanitizeStockCount(
            item.inventory.allocatedQuantity - item.quantity,
          );

          await tx.listing.update({
            where: { id: item.listing.id },
            data: {
              quantity: remainingListingQuantity,
              active: remainingListingQuantity > 0,
            },
          });

          await tx.inventory.update({
            where: { id: item.inventory.id },
            data: {
              quantity: remainingInventoryQuantity,
              allocatedQuantity: remainingAllocatedQuantity,
            },
          });

          await restockBuyerInventory(tx, user.shop?.id, buyer.id, item.listing.productId, item.quantity, item.unitPrice);

          await tx.orderLineItem.create({
            data: {
              orderId: order.id,
              productId: item.listing.productId,
              listingId: item.listing.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            },
          });

          if (remainingListingQuantity <= 3) {
            await tx.notification.create({
              data: {
                userId: seller.id,
                type: NotificationType.LOW_STOCK,
                message: `${item.listing.product.name}: ${getLiveStockStatusMessage(
                  remainingListingQuantity,
                )}.`,
              },
            });
          }
        }

        await tx.shop.update({
          where: { id: cart.shopId! },
          data: {
            totalRevenue: {
              increment: marketplaceTotal,
            },
            totalSales: {
              increment: marketplaceItems.reduce((sum, item) => sum + item.quantity, 0),
            },
            rating: clamp(cart.shop.rating + 0.03, 1, 5),
          },
        });

        await tx.notification.create({
          data: {
            userId: seller.id,
            type: NotificationType.SALE,
              message: `${buyer.displayName} bought ${saleSummary.join(", ")} for ${formatCurrency(
              marketplaceTotal,
              seller.currencyCode,
            )}.`,
          },
        });
      }

      for (const item of supplierItems) {
        await tx.marketProductState.update({
          where: { productId: item.productId },
          data: {
            supplierStock: {
              decrement: item.quantity,
            },
          },
        });

        await restockBuyerInventory(tx, user.shop?.id, buyer.id, item.productId, item.quantity, item.unitPrice);
      }

      if (supplierItems.length > 0) {
        await tx.notification.create({
          data: {
            userId: buyer.id,
            type: NotificationType.SYSTEM,
            message: `Supplier checkout completed: ${supplierSummary.join(", ")} for ${formatCurrency(
              supplierTotal,
              currencyCode,
            )}.`,
          },
        });
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: {
          status: "CHECKED_OUT",
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return redirectWithError(request, message);
  }

  revalidatePath("/marketplace");
  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/supplier");
  revalidatePath("/notifications");
  return NextResponse.redirect(new URL("/orders?checkout=1", request.url), 303);
}

async function restockBuyerInventory(
  tx: Prisma.TransactionClient,
  buyerShopId: string | undefined,
  buyerId: string,
  productId: string,
  quantity: number,
  unitPrice: number,
) {
  const buyerInventory = await tx.inventory.findUnique({
    where: {
      userId_productId: {
        userId: buyerId,
        productId,
      },
    },
    select: {
      id: true,
      quantity: true,
      allocatedQuantity: true,
      averageUnitCost: true,
    },
  });

  const buyerListing = buyerShopId
    ? await tx.listing.findUnique({
        where: {
          shopId_productId: {
            shopId: buyerShopId,
            productId,
          },
        },
        select: {
          id: true,
        },
      })
    : null;
  const shouldRestockBuyerListing = Boolean(buyerListing);
  const nextBuyerQuantity = (buyerInventory?.quantity ?? 0) + quantity;
  const buyerCostTotal =
    (buyerInventory?.averageUnitCost ?? 0) * (buyerInventory?.quantity ?? 0) + unitPrice * quantity;
  const nextBuyerAverageCost =
    nextBuyerQuantity > 0 ? Math.round(buyerCostTotal / nextBuyerQuantity) : unitPrice;
  const nextAllocatedQuantity =
    (buyerInventory?.allocatedQuantity ?? 0) + (shouldRestockBuyerListing ? quantity : 0);

  if (buyerInventory) {
    await tx.inventory.update({
      where: { id: buyerInventory.id },
      data: {
        quantity: {
          increment: quantity,
        },
        allocatedQuantity: nextAllocatedQuantity,
        averageUnitCost: nextBuyerAverageCost,
      },
    });
  } else {
    await tx.inventory.create({
      data: {
        userId: buyerId,
        productId,
        quantity,
        allocatedQuantity: shouldRestockBuyerListing ? quantity : 0,
        averageUnitCost: nextBuyerAverageCost,
      },
    });
  }

  if (shouldRestockBuyerListing && buyerListing) {
    await tx.listing.update({
      where: { id: buyerListing.id },
      data: {
        quantity: {
          increment: quantity,
        },
        active: true,
      },
    });
  }
}
