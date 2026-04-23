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
const BOT_MIN_PURCHASE_INTERVAL_SECONDS = 30;
const BOT_MAX_PURCHASE_INTERVAL_SECONDS = 90;
const BOT_SHOP_ACTIVITY_LOOKBACK_MINUTES = 18;
const DEFAULT_SIMULATION_ELAPSED_MS = 60 * 1000;
const SEEDED_LOYALTY_GRACE_MS = 2 * 60 * 1000;
const BOT_WALLET_TARGET_BALANCE = 500_000;
const BOT_WALLET_REFILL_FLOOR = 120_000;

type BotCandidateListing = {
  id: string;
  shopId: string;
  price: number;
  quantity: number;
  productId: string;
  shop: {
    id: string;
    ownerId: string;
    rating: number;
    totalSales: number;
  };
  product: {
    id: string;
    name: string;
    category: ProductCategory;
    marketState: {
      demandScore: number;
      marketAveragePrice: number;
    } | null;
  };
};

type ActiveBotRecord = {
  id: string;
  displayName: string;
  type: BotPersonality;
  budget: number;
  preferenceCategory: ProductCategory;
  loyaltyShopId: string | null;
  activityLevel: number;
  active: boolean;
  lastAttemptedAt: Date | null;
  lastPurchasedAt: Date | null;
  nextPurchaseAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

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

function toSecondStamp(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

function fromSecondStamp(secondStamp: number) {
  return new Date(secondStamp * 1000);
}

function randomIntInclusive(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function claimUniqueFutureSecond(
  anchorDate: Date,
  occupiedSeconds: Set<number>,
  minimumDelaySeconds: number,
  maximumDelaySeconds: number,
  preferredDelaySeconds?: number,
) {
  const anchorSecond = toSecondStamp(anchorDate);

  if (preferredDelaySeconds !== undefined) {
    const preferredSecond = anchorSecond + preferredDelaySeconds;
    if (!occupiedSeconds.has(preferredSecond)) {
      occupiedSeconds.add(preferredSecond);
      return preferredSecond;
    }
  }

  for (let attempt = 0; attempt < 128; attempt += 1) {
    const candidateSecond =
      anchorSecond + randomIntInclusive(minimumDelaySeconds, maximumDelaySeconds);

    if (!occupiedSeconds.has(candidateSecond)) {
      occupiedSeconds.add(candidateSecond);
      return candidateSecond;
    }
  }

  for (let delaySeconds = minimumDelaySeconds; delaySeconds <= maximumDelaySeconds; delaySeconds += 1) {
    const candidateSecond = anchorSecond + delaySeconds;

    if (!occupiedSeconds.has(candidateSecond)) {
      occupiedSeconds.add(candidateSecond);
      return candidateSecond;
    }
  }

  let candidateSecond = anchorSecond + minimumDelaySeconds;
  while (occupiedSeconds.has(candidateSecond)) {
    candidateSecond += 1;
  }

  occupiedSeconds.add(candidateSecond);
  return candidateSecond;
}

function claimUniqueAttemptSecond(attemptDate: Date, occupiedSeconds: Set<number>) {
  let candidateSecond = toSecondStamp(attemptDate);

  while (occupiedSeconds.has(candidateSecond)) {
    candidateSecond += 1;
  }

  occupiedSeconds.add(candidateSecond);
  return fromSecondStamp(candidateSecond);
}

function scheduleInitialPurchaseAt(
  now: Date,
  occupiedSeconds: Set<number>,
  index: number,
) {
  const preferredDelaySeconds = 35 + index * 13;

  return fromSecondStamp(
    claimUniqueFutureSecond(
      now,
      occupiedSeconds,
      BOT_MIN_PURCHASE_INTERVAL_SECONDS,
      BOT_MAX_PURCHASE_INTERVAL_SECONDS,
      preferredDelaySeconds,
    ),
  );
}

function scheduleNextPurchaseAt(now: Date, occupiedSeconds: Set<number>) {
  return fromSecondStamp(
    claimUniqueFutureSecond(
      now,
      occupiedSeconds,
      BOT_MIN_PURCHASE_INTERVAL_SECONDS,
      BOT_MAX_PURCHASE_INTERVAL_SECONDS,
    ),
  );
}

async function ensureActiveBotPool(now: Date) {
  const configuredBotNames = INITIAL_BOTS.map((bot) => bot.displayName);

  await prisma.botCustomer.updateMany({
    where: {
      displayName: {
        notIn: configuredBotNames,
      },
    },
    data: {
      active: false,
    },
  });

  const existingBots = await prisma.botCustomer.findMany({
    where: {
      displayName: {
        in: configuredBotNames,
      },
    },
  });

  const botsByName = new Map(existingBots.map((bot) => [bot.displayName, bot]));
  const occupiedSeconds = new Set<number>();
  const syncedBots: ActiveBotRecord[] = [];

  for (const [index, botSeed] of INITIAL_BOTS.entries()) {
    const existingBot = botsByName.get(botSeed.displayName);
    const existingSecond =
      existingBot?.nextPurchaseAt ? toSecondStamp(existingBot.nextPurchaseAt) : null;
    const hasUsableSchedule = existingSecond !== null && !occupiedSeconds.has(existingSecond);
    const nextPurchaseAt = hasUsableSchedule
      ? existingBot!.nextPurchaseAt!
      : scheduleInitialPurchaseAt(now, occupiedSeconds, index);

    if (hasUsableSchedule && existingSecond !== null) {
      occupiedSeconds.add(existingSecond);
    }

    const syncedBot = await prisma.botCustomer.upsert({
      where: { displayName: botSeed.displayName },
      update: {
        type: botSeed.type,
        budget: botSeed.budget,
        preferenceCategory: botSeed.preferenceCategory,
        activityLevel: botSeed.activityLevel,
        active: true,
        nextPurchaseAt,
      },
      create: {
        displayName: botSeed.displayName,
        type: botSeed.type,
        budget: botSeed.budget,
        preferenceCategory: botSeed.preferenceCategory,
        loyaltyShopId: null,
        activityLevel: botSeed.activityLevel,
        active: true,
        nextPurchaseAt,
      },
    });

    syncedBots.push(syncedBot);
  }

  return syncedBots;
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
  listing: BotCandidateListing,
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

function getDesiredBotQuantity(
  personality: BotPersonality,
  maxAffordableUnits: number,
  availableQuantity: number,
) {
  const maxPurchaseableUnits = Math.max(
    1,
    Math.min(maxAffordableUnits, availableQuantity, personality === BotPersonality.BULK ? 6 : 3),
  );

  if (personality === BotPersonality.BULK) {
    const minimumBulkQuantity = Math.min(
      maxPurchaseableUnits,
      Math.max(2, Math.ceil(maxPurchaseableUnits * 0.5)),
    );
    return randomIntInclusive(minimumBulkQuantity, maxPurchaseableUnits);
  }

  return randomIntInclusive(1, maxPurchaseableUnits);
}

export async function runMarketSimulation(force = false, debug = false) {
  const now = new Date();
  const bots = await ensureActiveBotPool(now);
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
    return {
      skipped: true,
      ...(debug
        ? {
            debug: {
              bots: bots
                .slice()
                .sort((left, right) => left.displayName.localeCompare(right.displayName))
                .map((bot) => ({
                  bot: bot.displayName,
                  nextPurchaseAt: bot.nextPurchaseAt?.toISOString() ?? null,
                  lastAttemptedAt: bot.lastAttemptedAt?.toISOString() ?? null,
                  lastPurchasedAt: bot.lastPurchasedAt?.toISOString() ?? null,
                })),
            },
          }
        : {}),
    };
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
      state.demandScore +
        (Math.random() * 0.14 - 0.07) +
        getTimeBoost(state.product.category, phase) +
        eventBoost,
      0.78,
      1.45,
    );

    const nextSupplierPrice = Math.round(
      state.product.basePrice *
        clamp(0.58 + nextDemand * 0.18 + state.popularityScore * 0.03, 0.52, 0.88),
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

  let botWallet = await prisma.user.findUnique({
    where: { username: "bot_market" },
    select: {
      id: true,
      balance: true,
    },
  });

  if (!botWallet) {
    return { skipped: false, botPurchases: 0 };
  }

  if (botWallet.balance < BOT_WALLET_REFILL_FLOOR) {
    botWallet = await prisma.user.update({
      where: { id: botWallet.id },
      data: {
        balance: BOT_WALLET_TARGET_BALANCE,
      },
      select: {
        id: true,
        balance: true,
      },
    });
  }

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

  const candidateListings = (await prisma.listing.findMany({
    where: {
      active: true,
      quantity: { gt: 0 },
      shop: { status: "ACTIVE" },
    },
    select: {
      id: true,
      shopId: true,
      price: true,
      quantity: true,
      productId: true,
      shop: {
        select: {
          id: true,
          ownerId: true,
          rating: true,
          totalSales: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          category: true,
          marketState: {
            select: {
              demandScore: true,
              marketAveragePrice: true,
            },
          },
        },
      },
    },
  })) satisfies BotCandidateListing[];

  const occupiedFutureSeconds = new Set<number>();
  for (const bot of bots) {
    if (bot.nextPurchaseAt) {
      occupiedFutureSeconds.add(toSecondStamp(bot.nextPurchaseAt));
    }
  }

  const dueBots = bots
    .filter((bot) => !bot.nextPurchaseAt || bot.nextPurchaseAt <= now)
    .sort((left, right) => {
      const leftStamp = left.nextPurchaseAt ? left.nextPurchaseAt.getTime() : 0;
      const rightStamp = right.nextPurchaseAt ? right.nextPurchaseAt.getTime() : 0;

      if (leftStamp !== rightStamp) {
        return leftStamp - rightStamp;
      }

      return left.displayName.localeCompare(right.displayName);
    });

  const occupiedAttemptSeconds = new Set<number>();
  const debugSnapshots: Array<{
    bot: string;
    attemptedAt: string;
    nextPurchaseAt: string;
    budget: number;
    candidateShopIds: string[];
    affordableListingCount: number;
    selectedShopId: string | null;
    selectedProduct: string | null;
    selectedQuantity: number;
    completedPurchase: boolean;
  }> = [];

  let botPurchases = 0;

  for (const bot of dueBots) {
    if (bot.nextPurchaseAt) {
      occupiedFutureSeconds.delete(toSecondStamp(bot.nextPurchaseAt));
    }

    const attemptedAt = claimUniqueAttemptSecond(bot.nextPurchaseAt ?? now, occupiedAttemptSeconds);
    const nextPurchaseAt = scheduleNextPurchaseAt(attemptedAt, occupiedFutureSeconds);
    const effectiveLoyaltyShopId = getEffectiveLoyaltyShopId(bot);
    const affordableListings = candidateListings.filter((listing) => listing.price <= bot.budget);
    const weightedSelection = affordableListings.map((listing) => ({
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
    }));
    const selection = pickWeighted(weightedSelection);

    let completedPurchase = false;
    let selectedProduct: string | null = null;
    let selectedShopId: string | null = null;
    let selectedQuantity = 0;

    if (selection) {
      selectedProduct = selection.product.name;
      selectedShopId = selection.shopId;

      const maxAffordableUnits = Math.max(1, Math.floor(bot.budget / selection.price));
      selectedQuantity = getDesiredBotQuantity(bot.type, maxAffordableUnits, selection.quantity);
      const totalPrice = selection.price * selectedQuantity;

      await prisma.$transaction(async (tx) => {
        const freshListing = await tx.listing.findUnique({
          where: { id: selection.id },
          include: {
            product: true,
            shop: true,
          },
        });

        if (!freshListing || !freshListing.active || freshListing.quantity < selectedQuantity) {
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
          select: {
            id: true,
          },
        });

        if (!botBuyer || botBuyer.balance < totalPrice || !seller) {
          return;
        }

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

        if (
          !inventory ||
          inventory.quantity < selectedQuantity ||
          inventory.allocatedQuantity < selectedQuantity
        ) {
          return;
        }

        const order = await tx.order.create({
          data: {
            buyerId: botBuyer.id,
            sellerId: seller.id,
            shopId: freshListing.shopId,
            totalPrice,
            createdAt: attemptedAt,
          },
        });

        await tx.orderLineItem.create({
          data: {
            orderId: order.id,
            productId: freshListing.productId,
            listingId: freshListing.id,
            quantity: selectedQuantity,
            unitPrice: freshListing.price,
            lineTotal: totalPrice,
            createdAt: attemptedAt,
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
              increment: selectedQuantity,
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
              decrement: selectedQuantity,
            },
            active: freshListing.quantity - selectedQuantity > 0,
          },
        });

        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: {
              decrement: selectedQuantity,
            },
            allocatedQuantity: {
              decrement: selectedQuantity,
            },
          },
        });

        await tx.notification.create({
          data: {
            userId: seller.id,
            type: NotificationType.SALE,
            message: `${bot.displayName} bought ${selectedQuantity}x ${freshListing.product.name} for $${(
              totalPrice / 100
            ).toFixed(2)}.`,
            createdAt: attemptedAt,
          },
        });

        if (freshListing.quantity - selectedQuantity <= 3) {
          await tx.notification.create({
            data: {
              userId: seller.id,
              type: NotificationType.LOW_STOCK,
              message: `${freshListing.product.name} is running low. Only ${Math.max(
                freshListing.quantity - selectedQuantity,
                0,
              )} left in your live listing.`,
              createdAt: attemptedAt,
            },
          });
        }

        await tx.botCustomer.update({
          where: { id: bot.id },
          data: {
            lastAttemptedAt: attemptedAt,
            lastPurchasedAt: attemptedAt,
            nextPurchaseAt,
            loyaltyShopId:
              bot.type === BotPersonality.LOYAL || bot.type === BotPersonality.QUALITY
                ? freshListing.shopId
                : bot.loyaltyShopId,
          },
        });

        completedPurchase = true;
      });
    }

    if (!completedPurchase) {
      await prisma.botCustomer.update({
        where: { id: bot.id },
        data: {
          lastAttemptedAt: attemptedAt,
          nextPurchaseAt,
        },
      });
    } else {
      botPurchases += 1;
      if (selectedShopId) {
        recentBotSalesByShop.set(selectedShopId, (recentBotSalesByShop.get(selectedShopId) ?? 0) + 1);
      }
    }

    if (debug) {
      debugSnapshots.push({
        bot: bot.displayName,
        attemptedAt: attemptedAt.toISOString(),
        nextPurchaseAt: nextPurchaseAt.toISOString(),
        budget: bot.budget,
        candidateShopIds: Array.from(new Set(affordableListings.map((listing) => listing.shopId))).sort(),
        affordableListingCount: affordableListings.length,
        selectedShopId,
        selectedProduct,
        selectedQuantity,
        completedPurchase,
      });
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
            bots: await prisma.botCustomer
              .findMany({
                where: {
                  displayName: {
                    in: INITIAL_BOTS.map((bot) => bot.displayName),
                  },
                },
                orderBy: {
                  displayName: "asc",
                },
                select: {
                  displayName: true,
                  nextPurchaseAt: true,
                  lastAttemptedAt: true,
                  lastPurchasedAt: true,
                  loyaltyShopId: true,
                },
              })
              .then((botStates) =>
                botStates.map((botState) => ({
                  bot: botState.displayName,
                  nextPurchaseAt: botState.nextPurchaseAt?.toISOString() ?? null,
                  lastAttemptedAt: botState.lastAttemptedAt?.toISOString() ?? null,
                  lastPurchasedAt: botState.lastPurchasedAt?.toISOString() ?? null,
                  loyaltyShopId: botState.loyaltyShopId,
                })),
              ),
            dueBotsProcessed: dueBots.length,
            snapshots: debugSnapshots,
          },
        }
      : {}),
  };
}
