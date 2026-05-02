import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeStockCount } from "@/lib/stock";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

const MARKUP_TIERS: Array<{ minAudDollars: number; addAudCents: number }> = [
  { minAudDollars: 100, addAudCents: 3000 },
  { minAudDollars: 50, addAudCents: 1500 },
  { minAudDollars: 20, addAudCents: 750 },
  { minAudDollars: 10, addAudCents: 500 },
  { minAudDollars: 5, addAudCents: 200 },
  { minAudDollars: 1, addAudCents: 50 },
  { minAudDollars: 0, addAudCents: 25 },
];

function resolveMarkupFromAudCost(audCostCents: number) {
  const audCostDollars = audCostCents / 100;
  const tier = MARKUP_TIERS.find((candidate) => audCostDollars >= candidate.minAudDollars);
  return tier?.addAudCents ?? 0;
}

function buildRedirectUrl(request: Request, params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return new URL(`/dashboard${query ? `?${query}` : ""}`, request.url);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  if (!hasCompletedSecuritySetup(user)) {
    return NextResponse.redirect(new URL("/security-setup", request.url), 303);
  }

  if (!user.shop) {
    return NextResponse.redirect(new URL("/onboarding/shop", request.url), 303);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const inventories = await tx.inventory.findMany({
        where: {
          userId: user.id,
          quantity: {
            gt: 0,
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              basePrice: true,
            },
          },
        },
        orderBy: {
          product: {
            name: "asc",
          },
        },
      });

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const inventory of inventories) {
        const freeToList = sanitizeStockCount(
          sanitizeStockCount(inventory.quantity) - sanitizeStockCount(inventory.allocatedQuantity),
        );
        if (freeToList <= 0) {
          skipped += 1;
          continue;
        }

        const listing = await tx.listing.findUnique({
          where: {
            shopId_productId: {
              shopId: user.shop!.id,
              productId: inventory.productId,
            },
          },
          select: {
            id: true,
            quantity: true,
          },
        });

        const effectiveCost = sanitizeStockCount(inventory.averageUnitCost) > 0
          ? sanitizeStockCount(inventory.averageUnitCost)
          : sanitizeStockCount(inventory.product.basePrice);
        const markup = resolveMarkupFromAudCost(effectiveCost);
        const nextPrice = sanitizeStockCount(effectiveCost + markup);

        if (listing) {
          const nextQuantity = sanitizeStockCount(sanitizeStockCount(listing.quantity) + freeToList);
          await tx.listing.update({
            where: { id: listing.id },
            data: {
              price: nextPrice,
              quantity: nextQuantity,
              active: nextQuantity > 0,
              isPaused: false,
              currencyCode: "AUD",
              soldOutAt: null,
            },
          });
          updated += 1;
        } else {
          await tx.listing.create({
            data: {
              shopId: user.shop!.id,
              productId: inventory.productId,
              price: nextPrice,
              quantity: freeToList,
              active: true,
              isPaused: false,
              currencyCode: "AUD",
              soldOutAt: null,
            },
          });
          created += 1;
        }

        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            allocatedQuantity: sanitizeStockCount(sanitizeStockCount(inventory.allocatedQuantity) + freeToList),
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          message: `List all products completed. Listed ${created}, restocked ${updated}, skipped ${skipped}.`,
        },
      });

      return {
        created,
        updated,
        skipped,
      };
    });

    revalidatePath("/dashboard");
    revalidatePath("/marketplace");
    revalidatePath(`/shop/${user.shop.id}`);

    return NextResponse.redirect(
      buildRedirectUrl(request, {
        listingSuccess: "1",
        bulkListed: "1",
        bulkListedCreated: String(result.created),
        bulkListedUpdated: String(result.updated),
        bulkListedSkipped: String(result.skipped),
      }),
      303,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list all products";
    return NextResponse.redirect(
      buildRedirectUrl(request, {
        error: message,
      }),
      303,
    );
  }
}
