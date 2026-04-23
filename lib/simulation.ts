import {
  BotPersonality,
  MarketTimePhase,
  NotificationType,
  ProductCategory,
} from "@prisma/client";
import { subMinutes } from "date-fns";

import { INITIAL_BOTS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { clamp } from "@/lib/utils";

const TICK_SECONDS = Number(process.env.SIMULATION_TICK_SECONDS ?? 60);
const BOT_MIN_PURCHASE_INTERVAL_MS = 30 * 1000;
const BOT_INTERVAL_VARIANCE_MS = 60 * 1000;
const BOT_SHOP_ACTIVITY_LOOKBACK_MINUTES = 18;
const DEFAULT_SIMULATION_ELAPSED_MS = 60 * 1000;
const SEEDED_LOYALTY_GRACE_MS = 2 * 60 * 1000;

function getCategoryAffinityScore(
  preferenceCategory: ProductCategory,
  listingCategory: ProductCategory,
) {
  if (preferenceCategory === listingCategory) {
    return 1.35;
  }

  if (
    (preferenceCategory === ProductCategory.FRUIT_AND_VEGETABLES &&
      listingCategory === ProductCategory.BAKERY_AND_GRAINS) ||
    (preferenceCategory === ProductCategory.BAKERY_AND_GRAINS &&
      listingCategory === ProductCategory.PANTRY_AND_COOKING) ||
    (preferenceCategory === ProductCategory.DRINKS &&
      listingCategory === ProductCategory.SNACKS_AND_SWEETS) ||
    (preferenceCategory === ProductCategory.MEAT_DAIRY_AND_PROTEIN &&
      listingCategory === ProductCategory.PANTRY_AND_COOKING) ||
    (preferenceCategory === ProductCategory.CLEANING_AND_PERSONAL_CARE &&
      listingCategory === ProductCategory.HOME_AND_STORAGE) ||
    (preferenceCategory === ProductCategory.CLOTHING &&
      listingCategory === ProductCategory.SCHOOL_AND_MISC) ||
    (preferenceCategory === ProductCategory.KITCHEN_AND_COOKWARE &&
      listingCategory === ProductCategory.HOME_AND_STORAGE)
  ) {
    return 1.05;
  }

  return 0.72;
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getBotIntervalMs(botId: string) {
  return BOT_MIN_PURCHASE_INTERVAL_MS + (hashString(botId) % BOT_INTERVAL_VARIANCE_MS);
}

function getBotMarketTempoFactor(
  bot: {
    budget: number;
    preferenceCategory: ProductCategory;
    activityLevel: number;
  },
  listings: Array<{
    price: number;
    quantity: number;
    product: {
      category: ProductCategory;
    };
  }>,
) {
  const affordable = listings.filter((listing) => listing.price <= bot.budget);

  if (affordable.length === 0) {
    return 1.12;
  }

  const preferredListings = affordable.filter(
    (listing) =>
      getCategoryAffinityScore(bot.preferenceCategory, listing.product.category) >= 1.05,
  );

  const cheapestRatio = Math.min(
    ...affordable.map((listing) => listing.price / Math.max(bot.budget, 100)),
  );
  const bestCategoryAffinity = Math.max(
    ...affordable.map((listing) =>
      getCategoryAffinityScore(bot.preferenceCategory, listing.product.category),
    ),
  );
  const averageVisibleStock =
    affordable.reduce((sum, listing) => sum + Math.min(listing.quantity, 12), 0) / affordable.length;

  const affordabilityBoost = clamp(0.55 - cheapestRatio, 0, 0.3);
  const preferenceBoost = clamp((bestCategoryAffinity - 1) * 0.32, 0, 0.14);
  const preferenceDepthBoost = clamp(preferredListings.length / 18, 0, 0.12);
  const stockBoost = clamp((averageVisibleStock - 2) / 40, 0, 0.08);
  const activityBoost = clamp((bot.activityLevel - 50) / 250, -0.04, 0.12);

  return clamp(
    1 - affordabilityBoost - preferenceBoost - preferenceDepthBoost - stockBoost - activityBoost,
    0.68,
    1.12,
  );
}

function getBotRecencyScore(lastPurchasedAt: Date | null, now: Date, intervalMs: number) {
  if (!lastPurchasedAt) {
    return 1.25;
  }

  const elapsed = now.getTime() - lastPurchasedAt.getTime();
  return clamp(elapsed / intervalMs, 0, 1.5);
}

async function ensureActiveBotPool() {
  for (const bot of INITIAL_BOTS) {
    await prisma.botCustomer.upsert({
      where: { displayName: bot.displayName },
      update: {
        type: bot.type,
        budget: bot.budget,
        preferenceCategory: bot.preferenceCategory,
        activityLevel: bot.activityLevel,
        active: true,
      },
      create: {
        displayName: bot.displayName,
        type: bot.type,
        budget: bot.budget,
        preferenceCategory: bot.preferenceCategory,
        activityLevel: bot.activityLevel,
        active: true,
      },
    });
  }
}

function getEffectiveLoyaltyShopId(
  bot: {
    loyaltyShopId: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
) {
  if (!bot.loyaltyShopId) {
    return null;
  }

  const looksSeeded =
    Math.abs(bot.updatedAt.getTime() - bot.createdAt.getTime()) <= SEEDED_LOYALTY_GRACE_MS;

  return looksSeeded ? null : bot.loyaltyShopId;
}

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
    category === ProductCategory.FRUIT_AND_VEGETABLES ||
    category === ProductCategory.BAKERY_AND_GRAINS ||
    category === ProductCategory.MEAT_DAIRY_AND_PROTEIN ||
    category === ProductCategory.DRINKS;

  if (phase === MarketTimePhase.MORNING && breakfastOrFresh) {
    return 0.12;
  }

  if (
    phase === MarketTimePhase.EVENING &&
    (category === ProductCategory.MEAT_DAIRY_AND_PROTEIN ||
      category === ProductCategory.PANTRY_AND_COOKING ||
      category === ProductCategory.SNACKS_AND_SWEETS ||
      category === ProductCategory.DRINKS)
  ) {
    return 0.08;
  }

  if (
    phase === MarketTimePhase.AFTERNOON &&
    (category === ProductCategory.CLOTHING ||
      category === ProductCategory.SCHOOL_AND_MISC ||
      category === ProductCategory.HOME_AND_STORAGE ||
      category === ProductCategory.ELECTRONICS)
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
    shop: { id: string; rating: number; totalSales: number };
    product: {
      category: ProductCategory;
      marketState: {
        demandScore: number;
        marketAveragePrice: number;
      } | null;
    };
  },
  loyaltyShopId: string | null,
  preferenceCategory: ProductCategory,
  recentBotSalesForShop: number,
  shopBreadthScore: number,
) {
  const affordability = 2200 / Math.max(listing.price, 120);
  const relativeDealScore = clamp(
    (listing.product.marketState?.marketAveragePrice ?? listing.price) / Math.max(listing.price, 1),
    0.74,
    1.26,
  );
  const ratingFactor = listing.shop.rating * 3.1;
  const stockFactor = Math.min(listing.quantity, 14);
  const loyaltyFactor = loyaltyShopId && loyaltyShopId === listing.shop.id ? 16 : 0;
  const categoryAffinity = getCategoryAffinityScore(preferenceCategory, listing.product.category);
  const demandFactor = listing.product.marketState?.demandScore ?? 1;
  const demandBoost = clamp(demandFactor, 0.82, 1.35) * 10;
  const recentSalesPenalty = clamp(1 - recentBotSalesForShop * 0.07, 0.72, 1.06);
  const assortmentBoost = shopBreadthScore * 5;
  const discoveryBoost = clamp(
    1.08 +
      clamp((18 - Math.min(listing.shop.totalSales, 18)) / 120, 0, 0.16) -
      recentBotSalesForShop * 0.04,
    0.9,
    1.16,
  );
  const randomnessBoost = 1 + Math.random() * 0.12;

  switch (personality) {
    case BotPersonality.BUDGET:
      return (
        affordability * 15 +
        relativeDealScore * 24 +
        stockFactor +
        demandBoost +
        assortmentBoost +
        loyaltyFactor * 0.35
      ) * categoryAffinity * recentSalesPenalty * discoveryBoost * randomnessBoost;
    case BotPersonality.QUALITY:
      return (
        ratingFactor * 3.4 +
        stockFactor * 0.5 +
        affordability * 4 +
        relativeDealScore * 18 +
        demandBoost +
        assortmentBoost +
        loyaltyFactor * 0.65
      ) * categoryAffinity * recentSalesPenalty * discoveryBoost * randomnessBoost;
    case BotPersonality.LOYAL:
      return (
        loyaltyFactor +
        ratingFactor * 1.8 +
        stockFactor +
        relativeDealScore * 12 +
        demandBoost * 0.6 +
        assortmentBoost
      ) * categoryAffinity * recentSalesPenalty * discoveryBoost * randomnessBoost;
    case BotPersonality.BULK:
      return (
        stockFactor * 3 +
        affordability * 9 +
        relativeDealScore * 10 +
        demandBoost * 0.7 +
        assortmentBoost * 1.15 +
        loyaltyFactor
      ) * categoryAffinity * recentSalesPenalty * discoveryBoost * randomnessBoost;
    default:
      return (
        affordability * 9 +
        ratingFactor * 1.4 +
        relativeDealScore * 14 +
        stockFactor +
        demandBoost +
        assortmentBoost +
        Math.random() * 12
      ) * categoryAffinity * recentSalesPenalty * discoveryBoost;
  }
}

export async function runMarketSimulation(force = false, debug = false) {
  await ensureActiveBotPool();

  const now = new Date();
  const worldState =
    (await prisma.worldState.findUnique({ where: { id: "global" } })) ??
    (await prisma.worldState.create({ data: { id: "global" } }));
  const elapsedSinceLastSimulationMs = worldState.lastSimulatedAt
    ? now.getTime() - worldState.lastSimulatedAt.getTime()
    : DEFAULT_SIMULATION_ELAPSED_MS;

  if (
    !force &&
    worldState.lastSimulatedAt &&
    elapsedSinceLastSimulationMs < TICK_SECONDS * 1000
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

  const marketTempoListings = await prisma.listing.findMany({
    where: {
      active: true,
      quantity: { gt: 0 },
      shop: { status: "ACTIVE" },
    },
    select: {
      price: true,
      quantity: true,
      product: {
        select: {
          category: true,
        },
      },
    },
  });

  const recentBotSales = await prisma.order.groupBy({
    by: ["shopId"],
    where: {
      buyerId: botWallet.id,
      createdAt: {
        gte: subMinutes(now, BOT_SHOP_ACTIVITY_LOOKBACK_MINUTES),
      },
    },
    _count: {
      _all: true,
    },
  });

  const recentBotSalesByShop = new Map(
    recentBotSales.map((entry) => [entry.shopId, entry._count._all]),
  );

  const shopListingDepth = await prisma.listing.groupBy({
    by: ["shopId"],
    where: {
      active: true,
      quantity: { gt: 0 },
      shop: { status: "ACTIVE" },
    },
    _count: {
      _all: true,
    },
    _sum: {
      quantity: true,
    },
  });

  const shopBreadthByShop = new Map(
    shopListingDepth.map((entry) => {
      const listingCountBoost = clamp(entry._count._all / 12, 0, 1);
      const stockDepthBoost = clamp((entry._sum.quantity ?? 0) / 80, 0, 1);
      return [entry.shopId, clamp(listingCountBoost * 0.65 + stockDepthBoost * 0.35, 0, 1)];
    }),
  );

  const eligibleBots = bots
    .map((bot) => {
      const baseIntervalMs = getBotIntervalMs(bot.id);
      const marketTempoFactor = getBotMarketTempoFactor(bot, marketTempoListings);
      const intervalMs = clamp(
        Math.round(baseIntervalMs * marketTempoFactor),
        BOT_MIN_PURCHASE_INTERVAL_MS,
        BOT_MIN_PURCHASE_INTERVAL_MS + BOT_INTERVAL_VARIANCE_MS,
      );
      const recencyScore = getBotRecencyScore(bot.lastPurchasedAt, now, intervalMs);
      const activityScore = bot.activityLevel / 100;
      const shouldAct = recencyScore >= 1 || Math.random() < recencyScore * activityScore;

      return {
        bot,
        intervalMs,
        marketTempoFactor,
        recencyScore,
        shouldAct,
      };
    })
    .filter((entry) => entry.shouldAct)
    .sort((left, right) => {
      if (right.recencyScore !== left.recencyScore) {
        return right.recencyScore - left.recencyScore;
      }

      return left.bot.displayName.localeCompare(right.bot.displayName);
    });

  const cadenceLoadFactor = clamp(elapsedSinceLastSimulationMs / DEFAULT_SIMULATION_ELAPSED_MS, 0.85, 2.25);
  const demandPressureFactor = clamp(eligibleBots.length / 8, 0, 1.2);
  const weightedPurchaseBudget = cadenceLoadFactor + demandPressureFactor + Math.random() * 0.9;
  const maxPurchasesThisTick =
    eligibleBots.length === 0
      ? 0
      : Math.min(4, eligibleBots.length, Math.max(1, Math.round(weightedPurchaseBudget)));

  let botPurchases = 0;
  const debugSnapshots: Array<{
    bot: string;
    budget: number;
    candidateShopIds: string[];
    affordableListingCount: number;
    selectedShopId: string | null;
    selectedProduct: string | null;
  }> = [];

  for (const { bot } of eligibleBots.slice(0, maxPurchasesThisTick)) {
    const effectiveLoyaltyShopId = getEffectiveLoyaltyShopId(bot);
    const candidates = await prisma.listing.findMany({
      where: {
        active: true,
        quantity: { gt: 0 },
        shop: { status: "ACTIVE" },
      },
      include: {
        product: {
          include: {
            marketState: {
              select: {
                demandScore: true,
                marketAveragePrice: true,
              },
            },
          },
        },
        shop: true,
      },
    });

    const affordable = candidates.filter((listing) => listing.price <= bot.budget);
    if (affordable.length === 0) {
      if (debug) {
        debugSnapshots.push({
          bot: bot.displayName,
          budget: bot.budget,
          candidateShopIds: [],
          affordableListingCount: 0,
          selectedShopId: null,
          selectedProduct: null,
        });
      }
      continue;
    }

    const selection = pickWeighted(
      affordable.map((listing) => ({
        value: listing,
        score: Math.max(
          1,
          scoreBotCandidate(
            bot.type,
            listing,
            effectiveLoyaltyShopId,
            bot.preferenceCategory,
            recentBotSalesByShop.get(listing.shopId) ?? 0,
            shopBreadthByShop.get(listing.shopId) ?? 0,
          ),
        ),
      })),
    );

    if (!selection) continue;

    if (debug) {
      debugSnapshots.push({
        bot: bot.displayName,
        budget: bot.budget,
        candidateShopIds: Array.from(new Set(affordable.map((listing) => listing.shopId))).sort(),
        affordableListingCount: affordable.length,
        selectedShopId: selection.shopId,
        selectedProduct: selection.product.name,
      });
    }

    const maxAffordableUnits = Math.max(1, Math.floor(bot.budget / selection.price));
    const desiredQuantity =
      bot.type === BotPersonality.BULK
        ? clamp(Math.min(maxAffordableUnits, selection.quantity), 2, 6)
        : clamp(Math.min(maxAffordableUnits, selection.quantity), 1, 3);
    const quantity =
      desiredQuantity > 1 ? clamp(Math.ceil(Math.random() * desiredQuantity), 1, desiredQuantity) : 1;
    const totalPrice = selection.price * quantity;

    let completedPurchase = false;

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

      const botBuyer = await tx.user.findUnique({
        where: { id: botWallet.id },
        select: {
          id: true,
          balance: true,
        },
      });

      const seller = await tx.user.findUnique({
        where: { id: freshListing.shop.ownerId },
      });

      if (!botBuyer || botBuyer.balance < totalPrice || !seller) return;

      const inventory = await tx.inventory.findUnique({
        where: {
          userId_productId: {
            userId: seller.id,
            productId: freshListing.productId,
          },
        },
        select: {
          id: true,
          quantity: true,
          allocatedQuantity: true,
        },
      });

      if (!inventory || inventory.quantity < quantity || inventory.allocatedQuantity < quantity) {
        return;
      }

      const order = await tx.order.create({
        data: {
          buyerId: botBuyer.id,
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
        where: { id: botBuyer.id },
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

      completedPurchase = true;
    });

    if (completedPurchase) {
      botPurchases += 1;
      recentBotSalesByShop.set(selection.shopId, (recentBotSalesByShop.get(selection.shopId) ?? 0) + 1);
    }
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
    ...(debug
      ? {
          debug: {
            eligibleBots: eligibleBots.length,
            maxPurchasesThisTick,
            snapshots: debugSnapshots,
          },
        }
      : {}),
  };
}
