import {
  BotPersonality,
  MarketTimePhase,
  NotificationType,
  ProductCategory,
} from "@prisma/client";
import { subMinutes } from "date-fns";

import { INITIAL_BOTS } from "@/lib/catalog";
import { formatCurrency } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { clamp } from "@/lib/utils";

const BOT_SHOP_ACTIVITY_LOOKBACK_MINUTES = 18;
const DEFAULT_SIMULATION_ELAPSED_MS = 60 * 1000;
const SEEDED_LOYALTY_GRACE_MS = 2 * 60 * 1000;
const BOT_WALLET_TARGET_BALANCE = 500_000;
const BOT_WALLET_REFILL_FLOOR = 120_000;

type BotCandidateListing = {
  id: string;
  shopId: string;
  price: number;
  currencyCode: string;
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
    basePrice: number;
    priceProfiles: Array<{
      currencyCode: string;
      marketAveragePrice: number;
      basePrice: number;
    }>;
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

function randomIntInclusive(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function claimUniqueAttemptSecond(attemptDate: Date, occupiedSeconds: Set<number>) {
  let candidateSecond = Math.floor(attemptDate.getTime() / 1000);

  while (occupiedSeconds.has(candidateSecond)) {
    candidateSecond += 1;
  }

  occupiedSeconds.add(candidateSecond);
  return new Date(candidateSecond * 1000);
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
  const syncedBots: ActiveBotRecord[] = [];

  for (const botSeed of INITIAL_BOTS) {
    const syncedBot = await prisma.botCustomer.upsert({
      where: { displayName: botSeed.displayName },
      update: {
        type: botSeed.type,
        budget: botSeed.budget,
        preferenceCategory: botSeed.preferenceCategory,
        activityLevel: botSeed.activityLevel,
        active: true,
      },
      create: {
        displayName: botSeed.displayName,
        type: botSeed.type,
        budget: botSeed.budget,
        preferenceCategory: botSeed.preferenceCategory,
        loyaltyShopId: null,
        activityLevel: botSeed.activityLevel,
        active: true,
      },
    });

    syncedBots.push(syncedBot);
  }

  return syncedBots;
}

function getBotAttemptProbability({
  bot,
  now,
  elapsedSinceLastAttemptMs,
  affordableListingCount,
  distinctShopCount,
  recentMarketSalesCount,
  averageDemand,
  averageCandidateScore,
  hasLoyaltyOption,
}: {
  bot: ActiveBotRecord;
  now: Date;
  elapsedSinceLastAttemptMs: number;
  affordableListingCount: number;
  distinctShopCount: number;
  recentMarketSalesCount: number;
  averageDemand: number;
  averageCandidateScore: number;
  hasLoyaltyOption: boolean;
}) {
  const elapsedFactor = clamp(elapsedSinceLastAttemptMs / (4.5 * 60 * 1000), 0.08, 1.2);
  const activityFactor = clamp(bot.activityLevel / 100, 0.4, 1.2);
  const assortmentFactor = clamp(affordableListingCount / 18, 0.05, 1.05);
  const shopExposureFactor = clamp(distinctShopCount / 6, 0.05, 1);
  const marketHeatFactor = clamp(recentMarketSalesCount / 8, 0, 0.55);
  const demandFactor = clamp((averageDemand - 0.82) / 0.58, 0, 1);
  const candidateStrengthFactor = clamp(averageCandidateScore / 52, 0, 1.25);
  const timeOfDayBoost =
    getCurrentPhase(now) === MarketTimePhase.EVENING
      ? 0.08
      : getCurrentPhase(now) === MarketTimePhase.MORNING
        ? 0.05
        : 0.03;

  const personalityBias =
    bot.type === BotPersonality.BUDGET
      ? 0.05
      : bot.type === BotPersonality.QUALITY
        ? 0.04
        : bot.type === BotPersonality.LOYAL
          ? hasLoyaltyOption
            ? 0.08
            : 0.01
          : bot.type === BotPersonality.BULK
            ? 0.06
            : 0.1;

  return clamp(
    0.025 +
      elapsedFactor * 0.14 +
      activityFactor * 0.08 +
      assortmentFactor * 0.1 +
      shopExposureFactor * 0.06 +
      marketHeatFactor * 0.06 +
      demandFactor * 0.08 +
      candidateStrengthFactor * 0.08 +
      timeOfDayBoost +
      personalityBias,
    0.02,
    0.55,
  );
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

function getListingReferencePrice(listing: BotCandidateListing) {
  const regionalProfile = listing.product.priceProfiles.find(
    (profile) => profile.currencyCode === listing.currencyCode,
  );
  const marketAveragePrice = listing.product.marketState?.marketAveragePrice ?? 0;
  return Math.max(
    regionalProfile?.marketAveragePrice ?? 0,
    regionalProfile?.basePrice ?? 0,
    listing.product.basePrice,
    marketAveragePrice,
    1,
  );
}

function getOverpriceRatio(listing: BotCandidateListing) {
  return listing.price / getListingReferencePrice(listing);
}

function getPriceSensitivityMultiplier(
  personality: BotPersonality,
  listing: BotCandidateListing,
  loyaltyShopId: string | null,
) {
  const ratingGrace =
    personality === BotPersonality.QUALITY && listing.shop.rating >= 4.6
      ? 0.08
      : personality === BotPersonality.LOYAL && loyaltyShopId === listing.shop.id
        ? 0.05
        : personality === BotPersonality.RANDOM
          ? 0.03
          : 0;
  const ratio = Math.max(0.6, getOverpriceRatio(listing) - ratingGrace);

  if (ratio <= 0.94) {
    return personality === BotPersonality.BUDGET || personality === BotPersonality.BULK ? 1.3 : 1.16;
  }

  if (ratio <= 1.05) {
    return 1;
  }

  if (ratio <= 1.25) {
    switch (personality) {
      case BotPersonality.BUDGET:
        return 0.18;
      case BotPersonality.BULK:
        return 0.14;
      case BotPersonality.QUALITY:
        return 0.55;
      case BotPersonality.LOYAL:
        return 0.42;
      default:
        return 0.32;
    }
  }

  if (ratio <= 1.5) {
    switch (personality) {
      case BotPersonality.BUDGET:
        return 0.015;
      case BotPersonality.BULK:
        return 0.01;
      case BotPersonality.QUALITY:
        return listing.shop.rating >= 4.7 ? 0.12 : 0.07;
      case BotPersonality.LOYAL:
        return loyaltyShopId === listing.shop.id ? 0.08 : 0.035;
      default:
        return 0.05;
    }
  }

  if (ratio <= 1.75 && personality === BotPersonality.RANDOM) {
    return 0.002;
  }

  if (ratio <= 1.75 && personality === BotPersonality.QUALITY && listing.shop.rating >= 4.85) {
    return 0.01;
  }

  return personality === BotPersonality.RANDOM ? 0.002 : 0.0005;
}

function scoreBotCandidate(
  personality: BotPersonality,
  listing: BotCandidateListing,
  loyaltyShopId: string | null,
  preferenceCategory: ProductCategory,
  recentBotSalesForShop: number,
  shopBreadthScore: number,
) {
  const referencePrice = getListingReferencePrice(listing);
  const overpriceRatio = getOverpriceRatio(listing);
  const priceSensitivity = getPriceSensitivityMultiplier(personality, listing, loyaltyShopId);
  const affordability = referencePrice / Math.max(listing.price, 120);
  const relativeDealScore = clamp(referencePrice / Math.max(listing.price, 1), 0.18, 1.5);
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
  const overpriceDrag = overpriceRatio > 1 ? clamp(1 / overpriceRatio ** 3, 0.02, 1) : 1.08;

  switch (personality) {
    case BotPersonality.BUDGET:
      return (
        affordability * 24 +
        relativeDealScore * 34 +
        stockFactor +
        demandBoost +
        assortmentBoost +
        loyaltyFactor * 0.35
      ) * categoryAffinity * recentSalesPenalty * discoveryBoost * randomnessBoost * priceSensitivity * overpriceDrag;
    case BotPersonality.QUALITY:
      return (
        ratingFactor * 3.4 +
        stockFactor * 0.5 +
        affordability * 4 +
        relativeDealScore * 20 +
        demandBoost +
        assortmentBoost +
        loyaltyFactor * 0.65
      ) * categoryAffinity * recentSalesPenalty * discoveryBoost * randomnessBoost * priceSensitivity * overpriceDrag;
    case BotPersonality.LOYAL:
      return (
        loyaltyFactor +
        ratingFactor * 1.8 +
        stockFactor +
        relativeDealScore * 16 +
        demandBoost * 0.6 +
        assortmentBoost
      ) * categoryAffinity * recentSalesPenalty * discoveryBoost * randomnessBoost * priceSensitivity * overpriceDrag;
    case BotPersonality.BULK:
      return (
        stockFactor * 3 +
        affordability * 16 +
        relativeDealScore * 22 +
        demandBoost * 0.7 +
        assortmentBoost * 1.15 +
        loyaltyFactor
      ) * categoryAffinity * recentSalesPenalty * discoveryBoost * randomnessBoost * priceSensitivity * overpriceDrag;
    default:
      return (
        affordability * 9 +
        ratingFactor * 1.4 +
        relativeDealScore * 14 +
        stockFactor +
        demandBoost +
        assortmentBoost +
        Math.random() * 12
      ) * categoryAffinity * recentSalesPenalty * discoveryBoost * priceSensitivity * overpriceDrag;
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
  const currencyCode = "AUD";
  const bots = await ensureActiveBotPool(now);
  const worldState =
    (await prisma.worldState.findUnique({ where: { id: "global" } })) ??
    (await prisma.worldState.create({ data: { id: "global" } }));
  const elapsedSinceLastSimulationMs = worldState.lastSimulatedAt
    ? now.getTime() - worldState.lastSimulatedAt.getTime()
    : DEFAULT_SIMULATION_ELAPSED_MS;

  const marketReadinessScore = clamp(
    elapsedSinceLastSimulationMs / (2.5 * 60 * 1000) +
      Math.random() * 0.35,
    0,
    1.35,
  );

  if (!force && worldState.lastSimulatedAt && marketReadinessScore < 0.18) {
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
      product: {
        include: {
          priceProfiles: {
            where: { currencyCode },
          },
        },
      },
    },
  });

  for (const state of productStates) {
    const listings = await prisma.listing.findMany({
      where: {
        productId: state.productId,
        active: true,
        isPaused: false,
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

    const regionalProfile = state.product.priceProfiles[0];
    const regionalBasePrice = regionalProfile?.basePrice ?? state.product.basePrice;
    const nextSupplierPrice = Math.round(
      regionalBasePrice *
        clamp(0.58 + nextDemand * 0.18 + state.popularityScore * 0.03, 0.52, 0.88),
    );

    await prisma.marketProductState.update({
      where: { id: state.id },
      data: {
        demandScore: Number(nextDemand.toFixed(2)),
        currentSupplierPrice: nextSupplierPrice,
        marketAveragePrice: marketAveragePrice || regionalProfile?.marketAveragePrice || regionalBasePrice,
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
      isPaused: false,
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
      isPaused: false,
      quantity: { gt: 0 },
      shop: { status: "ACTIVE" },
    },
    select: {
      id: true,
      shopId: true,
      price: true,
      currencyCode: true,
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
          basePrice: true,
          priceProfiles: {
            where: { currencyCode },
            select: {
              currencyCode: true,
              marketAveragePrice: true,
              basePrice: true,
            },
          },
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

  const occupiedAttemptSeconds = new Set<number>();
  const recentMarketSalesCount = recentBotSales.reduce((sum, entry) => sum + entry._count._all, 0);
  const candidateShopIds = new Set(candidateListings.map((listing) => listing.shopId));
  const debugSnapshots: Array<{
    bot: string;
    attemptedAt: string;
    attemptProbability: number;
    budget: number;
    candidateShopIds: string[];
    affordableListingCount: number;
    selectedShopId: string | null;
    selectedProduct: string | null;
    selectedQuantity: number;
    completedPurchase: boolean;
  }> = [];

  let botPurchases = 0;

  const botPlans = bots
    .map((bot) => {
      const effectiveLoyaltyShopId = getEffectiveLoyaltyShopId(bot);
      const affordableListings = candidateListings.filter((listing) => listing.price <= bot.budget);
      const weightedSelection = affordableListings
        .map((listing) => ({
          value: listing,
          score: scoreBotCandidate(
            bot.type,
            listing,
            effectiveLoyaltyShopId,
            bot.preferenceCategory,
            recentBotSalesByShop.get(listing.shopId) ?? 0,
            shopBreadthByShop.get(listing.shopId) ?? 0,
          ),
        }))
        .filter((option) => {
          const overpriceRatio = getOverpriceRatio(option.value);
          const hardCap =
            bot.type === BotPersonality.RANDOM
              ? 1.75
              : bot.type === BotPersonality.QUALITY
                ? 1.6
                : bot.type === BotPersonality.LOYAL
                  ? 1.55
                  : 1.5;

          return option.score >= 0.25 && overpriceRatio <= hardCap;
        });
      const averageCandidateScore =
        weightedSelection.length > 0
          ? weightedSelection.reduce((sum, option) => sum + option.score, 0) / weightedSelection.length
          : 0;
      const averageDemand =
        affordableListings.length > 0
          ? affordableListings.reduce(
              (sum, listing) => sum + (listing.product.marketState?.demandScore ?? 1),
              0,
            ) / affordableListings.length
          : 1;
      const elapsedSinceLastAttemptMs = Math.max(
        15_000,
        now.getTime() - (bot.lastAttemptedAt ?? bot.createdAt).getTime(),
      );
      const attemptProbability =
        affordableListings.length > 0
          ? getBotAttemptProbability({
              bot,
              now,
              elapsedSinceLastAttemptMs,
              affordableListingCount: affordableListings.length,
              distinctShopCount: new Set(affordableListings.map((listing) => listing.shopId)).size,
              recentMarketSalesCount,
              averageDemand,
              averageCandidateScore,
              hasLoyaltyOption: affordableListings.some(
                (listing) => listing.shopId === effectiveLoyaltyShopId,
              ),
            })
          : 0;

      return {
        bot,
        effectiveLoyaltyShopId,
        affordableListings,
        weightedSelection,
        attemptProbability,
      };
    })
    .sort((left, right) => right.attemptProbability - left.attemptProbability);

  const selectedBotPlans = botPlans.filter(
    (plan) => plan.weightedSelection.length > 0 && Math.random() < plan.attemptProbability,
  );

  for (const plan of selectedBotPlans) {
    const { bot, effectiveLoyaltyShopId, affordableListings, weightedSelection, attemptProbability } = plan;
    const attemptedAt = claimUniqueAttemptSecond(now, occupiedAttemptSeconds);
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

        if (
          !freshListing ||
          !freshListing.active ||
          freshListing.isPaused ||
          freshListing.quantity < selectedQuantity
        ) {
          return;
        }

        await tx.$queryRaw`SELECT "id" FROM "Listing" WHERE "id" = ${freshListing.id} FOR UPDATE`;

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
            currencyCode: true,
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

        await tx.$queryRaw`SELECT "id" FROM "Inventory" WHERE "id" = ${inventory.id} FOR UPDATE`;

        const remainingListingQuantity = Math.max(0, freshListing.quantity - selectedQuantity);
        const remainingInventoryQuantity = Math.max(0, inventory.quantity - selectedQuantity);
        const remainingAllocatedQuantity = Math.max(
          0,
          inventory.allocatedQuantity - selectedQuantity,
        );

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
            quantity: remainingListingQuantity,
            active: remainingListingQuantity > 0,
          },
        });

        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: remainingInventoryQuantity,
            allocatedQuantity: remainingAllocatedQuantity,
          },
        });

        await tx.notification.create({
          data: {
            userId: seller.id,
            type: NotificationType.SALE,
            message: `${bot.displayName} purchased from ${freshListing.shop.name}: ${selectedQuantity}x ${freshListing.product.name}. Total ${formatCurrency(
              totalPrice,
              seller.currencyCode,
            )}.`,
            createdAt: attemptedAt,
          },
        });

        if (remainingListingQuantity <= 3) {
          await tx.notification.create({
            data: {
              userId: seller.id,
              type: NotificationType.LOW_STOCK,
              message:
                remainingListingQuantity <= 0
                  ? `${freshListing.product.name}: You don't have any of this item left.`
                  : `${freshListing.product.name}: Low stock remaining: ${remainingListingQuantity} left.`,
              createdAt: attemptedAt,
            },
          });
        }

        await tx.botCustomer.update({
          where: { id: bot.id },
          data: {
            lastAttemptedAt: attemptedAt,
            lastPurchasedAt: attemptedAt,
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
        attemptProbability,
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
                  lastAttemptedAt: true,
                  lastPurchasedAt: true,
                  loyaltyShopId: true,
                  type: true,
                },
              })
              .then((botStates) =>
                botStates.map((botState) => ({
                  bot: botState.displayName,
                  type: botState.type,
                  lastAttemptedAt: botState.lastAttemptedAt?.toISOString() ?? null,
                  lastPurchasedAt: botState.lastPurchasedAt?.toISOString() ?? null,
                  loyaltyShopId: botState.loyaltyShopId,
                })),
              ),
            candidateShopCount: candidateShopIds.size,
            attemptedBots: selectedBotPlans.length,
            snapshots: debugSnapshots,
          },
        }
      : {}),
  };
}
