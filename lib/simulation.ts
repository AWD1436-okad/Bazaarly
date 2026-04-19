import {
  BotPersonality,
  MarketTimePhase,
  NotificationType,
  ProductCategory,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { clamp } from "@/lib/utils";

const TICK_SECONDS = Number(process.env.SIMULATION_TICK_SECONDS ?? 45);

function getCurrentPhase(date: Date) {
  const hour = date.getHours();

  if (hour >= 6 && hour < 12) return MarketTimePhase.MORNING;
  if (hour >= 12 && hour < 17) return MarketTimePhase.AFTERNOON;
  if (hour >= 17 && hour < 22) return MarketTimePhase.EVENING;
  return MarketTimePhase.NIGHT;
}

function pickWeighted<T>(options: Array<{ value: T; score: number }>) {
  const total = options.reduce((sum, option) => sum + option.score, 0);
  if (total <= 0) {
    return null;
  }

  let roll = Math.random() * total;
  for (const option of options) {
    roll -= option.score;
    if (roll <= 0) {
      return option.value;
    }
  }

  return options[0]?.value ?? null;
}

function getTimeBoost(category: ProductCategory, phase: MarketTimePhase) {
  const breakfastOrFresh =
    category === ProductCategory.PRODUCE ||
    category === ProductCategory.BAKERY ||
    category === ProductCategory.DAIRY_AND_EGGS ||
    category === ProductCategory.DRINKS;

  if (phase === MarketTimePhase.MORNING && breakfastOrFresh) {
    return 0.12;
  }

  if (
    phase === MarketTimePhase.EVENING &&
    (category === ProductCategory.MEAT_AND_SEAFOOD ||
      category === ProductCategory.PANTRY ||
      category === ProductCategory.SNACKS_AND_SWEETS ||
      category === ProductCategory.DRINKS)
  ) {
    return 0.08;
  }

  if (
    phase === MarketTimePhase.AFTERNOON &&
    (category === ProductCategory.CLOTHING_AND_FOOTWEAR ||
      category === ProductCategory.SCHOOL_STATIONERY_AND_TOYS ||
      category === ProductCategory.TECH_ELECTRONICS_AND_APPLIANCES)
  ) {
    return 0.07;
  }

  return 0;
}

function getTrendLabel(demandScore: number) {
  if (demandScore >= 1.2) return "High demand";
  if (demandScore >= 1.08) return "Trending";
  if (demandScore <= 0.9) return "Cooling";
  return "Stable";
}

function scoreBotCandidate(
  personality: BotPersonality,
  listing: {
    price: number;
    quantity: number;
    shop: { id: string; rating: number };
  },
  loyaltyShopId: string | null,
) {
  const affordability = 2200 / Math.max(listing.price, 120);
  const ratingFactor = listing.shop.rating * 4;
  const stockFactor = Math.min(listing.quantity, 14);
  const loyaltyFactor = loyaltyShopId && loyaltyShopId === listing.shop.id ? 30 : 0;

  switch (personality) {
    case BotPersonality.BUDGET:
      return affordability * 18 + stockFactor + loyaltyFactor * 0.4;
    case BotPersonality.QUALITY:
      return ratingFactor * 4 + stockFactor * 0.5 + affordability * 5 + loyaltyFactor * 0.8;
    case BotPersonality.LOYAL:
      return loyaltyFactor + ratingFactor * 2 + stockFactor;
    case BotPersonality.BULK:
      return stockFactor * 3 + affordability * 10 + loyaltyFactor;
    default:
      return affordability * 10 + ratingFactor * 1.5 + stockFactor + Math.random() * 12;
  }
}

export async function runMarketSimulation(force = false) {
  const now = new Date();
  const worldState =
    (await prisma.worldState.findUnique({ where: { id: "global" } })) ??
    (await prisma.worldState.create({ data: { id: "global" } }));

  if (
    !force &&
    worldState.lastSimulatedAt &&
    now.getTime() - worldState.lastSimulatedAt.getTime() < TICK_SECONDS * 1000
  ) {
    return { skipped: true };
  }

  const phase = getCurrentPhase(now);
  const activeEvent = await prisma.marketEvent.findFirst({
    where: {
      active: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
  });

  const productStates = await prisma.marketProductState.findMany({
    include: {
      product: true,
    },
  });

  for (const state of productStates) {
    const listings = await prisma.listing.findMany({
      where: {
        productId: state.productId,
        active: true,
        quantity: { gt: 0 },
        shop: {
          status: "ACTIVE",
        },
      },
      select: { price: true },
    });

    const marketAveragePrice =
      listings.length > 0
        ? Math.round(listings.reduce((sum, listing) => sum + listing.price, 0) / listings.length)
        : state.product.basePrice;

    const eventBoost =
      activeEvent &&
      (activeEvent.category === state.product.category || activeEvent.productId === state.productId)
        ? activeEvent.effectValue - 1
        : 0;

    const nextDemand = clamp(
      state.demandScore + (Math.random() * 0.14 - 0.07) + getTimeBoost(state.product.category, phase) + eventBoost,
      0.78,
      1.45,
    );

    const nextSupplierPrice = Math.round(
      state.product.basePrice * clamp(0.58 + nextDemand * 0.18 + state.popularityScore * 0.03, 0.52, 0.88),
    );

    await prisma.marketProductState.update({
      where: { id: state.id },
      data: {
        demandScore: Number(nextDemand.toFixed(2)),
        currentSupplierPrice: nextSupplierPrice,
        marketAveragePrice,
        trendLabel: getTrendLabel(nextDemand),
        supplierStock: clamp(state.supplierStock + 8, 120, 700),
      },
    });
  }

  const botWallet = await prisma.user.findUnique({
    where: { username: "bot_market" },
  });

  if (!botWallet) {
    return { skipped: false, botPurchases: 0 };
  }

  const bots = await prisma.botCustomer.findMany({
    where: { active: true },
  });

  let botPurchases = 0;

  for (const bot of bots) {
    const shouldAct = Math.random() < bot.activityLevel / 100;
    if (!shouldAct) continue;

    const candidates = await prisma.listing.findMany({
      where: {
        active: true,
        quantity: { gt: 0 },
        product: { category: bot.preferenceCategory },
        shop: { status: "ACTIVE" },
      },
      include: {
        product: true,
        shop: true,
      },
    });

    const affordable = candidates.filter((listing) => listing.price <= bot.budget);
    if (affordable.length === 0) continue;

    const selection = pickWeighted(
      affordable.map((listing) => ({
        value: listing,
        score: Math.max(1, scoreBotCandidate(bot.type, listing, bot.loyaltyShopId ?? null)),
      })),
    );

    if (!selection) continue;

    const maxAffordableUnits = Math.max(1, Math.floor(bot.budget / selection.price));
    const desiredQuantity =
      bot.type === BotPersonality.BULK
        ? clamp(Math.min(maxAffordableUnits, selection.quantity), 2, 6)
        : clamp(Math.min(maxAffordableUnits, selection.quantity), 1, 3);
    const quantity =
      desiredQuantity > 1 ? clamp(Math.ceil(Math.random() * desiredQuantity), 1, desiredQuantity) : 1;
    const totalPrice = selection.price * quantity;

    await prisma.$transaction(async (tx) => {
      const freshListing = await tx.listing.findUnique({
        where: { id: selection.id },
        include: {
          product: true,
          shop: true,
        },
      });

      if (!freshListing || !freshListing.active || freshListing.quantity < quantity) {
        return;
      }

      const seller = await tx.user.findUnique({
        where: { id: freshListing.shop.ownerId },
      });

      if (!seller) return;

      const order = await tx.order.create({
        data: {
          buyerId: botWallet.id,
          sellerId: seller.id,
          shopId: freshListing.shopId,
          totalPrice,
        },
      });

      await tx.orderLineItem.create({
        data: {
          orderId: order.id,
          productId: freshListing.productId,
          listingId: freshListing.id,
          quantity,
          unitPrice: freshListing.price,
          lineTotal: totalPrice,
        },
      });

      await tx.user.update({
        where: { id: seller.id },
        data: {
          balance: {
            increment: totalPrice,
          },
        },
      });

      await tx.user.update({
        where: { id: botWallet.id },
        data: {
          balance: {
            decrement: totalPrice,
          },
        },
      });

      await tx.shop.update({
        where: { id: freshListing.shopId },
        data: {
          totalRevenue: {
            increment: totalPrice,
          },
          totalSales: {
            increment: quantity,
          },
          rating: clamp(
            freshListing.shop.rating + (bot.type === BotPersonality.QUALITY ? 0.05 : 0.02),
            1,
            5,
          ),
        },
      });

      await tx.listing.update({
        where: { id: freshListing.id },
        data: {
          quantity: {
            decrement: quantity,
          },
          active: freshListing.quantity - quantity > 0,
        },
      });

      const inventory = await tx.inventory.findUnique({
        where: {
          userId_productId: {
            userId: seller.id,
            productId: freshListing.productId,
          },
        },
      });

      if (inventory) {
        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: {
              decrement: quantity,
            },
            allocatedQuantity: {
              decrement: quantity,
            },
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: seller.id,
          type: NotificationType.SALE,
          message: `${bot.displayName} bought ${quantity}x ${freshListing.product.name} for $${(
            totalPrice / 100
          ).toFixed(2)}.`,
        },
      });

      if (freshListing.quantity - quantity <= 3) {
        await tx.notification.create({
          data: {
            userId: seller.id,
            type: NotificationType.LOW_STOCK,
            message: `${freshListing.product.name} is running low. Only ${Math.max(
              freshListing.quantity - quantity,
              0,
            )} left in your live listing.`,
          },
        });
      }

      await tx.botCustomer.update({
        where: { id: bot.id },
        data: {
          lastPurchasedAt: now,
          loyaltyShopId:
            bot.type === BotPersonality.LOYAL || bot.type === BotPersonality.QUALITY
              ? freshListing.shopId
              : bot.loyaltyShopId,
        },
      });
    });

    botPurchases += 1;
  }

  await prisma.worldState.update({
    where: { id: "global" },
    data: {
      currentPhase: phase,
      lastSimulatedAt: now,
      currentDay: worldState.currentDay + (phase === MarketTimePhase.MORNING ? 1 : 0),
    },
  });

  return {
    skipped: false,
    botPurchases,
    phase,
  };
}
