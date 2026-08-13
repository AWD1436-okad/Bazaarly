import {
  AutoRestockPlan,
  AutoRestockSubscriptionStatus,
  BotPersonality,
  BusinessLedgerEntryCategory,
  BusinessLedgerEntryType,
  MarketTimePhase,
  NotificationType,
  ProductCategory,
} from "@prisma/client";
import { addHours, subMinutes } from "date-fns";

import {
  AUTO_RESTOCK_RENEWAL_HOURS,
  getAutoRestockRenewalCostCents,
  getPlanMeta,
  getRestockCoveragePercent,
  getRestockCycleMs,
  isRestockCycleDue,
} from "@/lib/auto-restock";
import { recordBusinessExpense } from "@/lib/business-ledger";
import { INITIAL_BOTS } from "@/lib/catalog";
import { formatCurrency } from "@/lib/money";
import { calculateProfit, getSaleCostUnitPrice } from "@/lib/profit";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { runSoldOutListingCleanup } from "@/lib/sold-out-cleanup";
import { sanitizeStockCount } from "@/lib/stock";
import { clamp } from "@/lib/utils";

const BOT_SHOP_ACTIVITY_LOOKBACK_MINUTES = 45;
const BOT_SHOP_PURCHASE_CAP_LOOKBACK_MINUTES = 60;
const BOT_SHOP_DAILY_CAP_LOOKBACK_MINUTES = 24 * 60;
const BOT_PURCHASE_CHANCE_BASE = 0.028;
const BOT_PURCHASE_CHANCE_MULTIPLIER = 2.45;
const BOT_MIN_PURCHASE_CHANCE = 0.025;
const BOT_MAX_PURCHASE_CHANCE = 0.68;
const BOT_MIN_COOLDOWN_MS = 75_000;
const BOT_MAX_COOLDOWN_MS = 4.5 * 60_000;
const BOT_ACTIVITY_SMALL_SHOP_MULTIPLIER = 1.35;
const BOT_ACTIVITY_MEDIUM_SHOP_MULTIPLIER = 1.9;
const BOT_ACTIVITY_BIG_SHOP_MULTIPLIER = 2.85;
const BOT_MAX_PURCHASES_SMALL_SHOP_PER_HOUR = 5;
const BOT_MAX_PURCHASES_MEDIUM_SHOP_PER_HOUR = 8;
const BOT_MAX_PURCHASES_BIG_SHOP_PER_HOUR = 12;
const BOT_MAX_PURCHASES_SMALL_SHOP_PER_DAY = 20;
const BOT_MAX_PURCHASES_MEDIUM_SHOP_PER_DAY = 36;
const BOT_MAX_PURCHASES_BIG_SHOP_PER_DAY = 60;
const MAX_BOT_PURCHASES_PER_SIMULATION = 5;
const DEFAULT_SIMULATION_ELAPSED_MS = 60 * 1000;
const SEEDED_LOYALTY_GRACE_MS = 2 * 60 * 1000;
const BOT_WALLET_TARGET_BALANCE = 500_000;
const BOT_WALLET_REFILL_FLOOR = 120_000;
// NPC shops use the same supplier pool as players. Keeping their shelf target
// small makes their stock visible and prevents the market from looking seeded.
const NPC_SHOP_RESTOCK_TARGET = 6;
const NPC_SHOP_RESTOCK_BATCH_SIZE = 3;
const MAX_NPC_SHOP_RESTOCKS_PER_SIMULATION = 12;
const ORIGINAL_SYSTEM_SHOP_EMAIL_SUFFIX = "@bazaarly.local";
const LEGACY_SYSTEM_SHOP_EMAIL_SUFFIX = "@tradex.local";
const SYSTEM_SHOP_EMAIL_SUFFIX = "@profitplanet.local";
const BOT_WALLET_EMAIL = "bot-market@profitplanet.local";
const MAX_NPC_LISTING_PRICE_MULTIPLIER = 1.8;
const NPC_SHOP_STOCK_RESET_MARKER = "All original, legacy, and current bot shops reset for shared supplier v7";

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

export type AutoRestockCycleResult = {
  status:
    | "not_due"
    | "pending_exists"
    | "no_active_subscription"
    | "subscription_cancelled"
    | "no_sold_out_items"
    | "no_supplier_stock"
    | "insufficient_balance"
    | "auto_purchase_completed"
    | "auto_purchase_waiting";
  message: string;
  itemCount?: number;
  totalCostCents?: number;
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
      listingCategory === ProductCategory.MUSLIM_CLOTHING_AND_APPAREL) ||
    (preferenceCategory === ProductCategory.MUSLIM_CLOTHING_AND_APPAREL &&
      listingCategory === ProductCategory.CLOTHING) ||
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
  const elapsedFactor = clamp(elapsedSinceLastAttemptMs / (4.5 * 60 * 1000), 0.08, 1.25);
  const activityFactor = clamp(bot.activityLevel / 95, 0.48, 1.18);
  const assortmentFactor = clamp(affordableListingCount / 16, 0.08, 1);
  const shopExposureFactor = clamp(distinctShopCount / 5, 0.1, 1);
  const marketCooldownFactor = clamp(1 - recentMarketSalesCount / 44, 0.58, 1);
  const demandFactor = clamp((averageDemand - 0.82) / 0.58, 0, 1);
  const candidateStrengthFactor = clamp(averageCandidateScore / 78, 0, 1);
  const timeOfDayBoost =
    getCurrentPhase(now) === MarketTimePhase.EVENING
      ? 0.025
      : getCurrentPhase(now) === MarketTimePhase.MORNING
        ? 0.018
        : 0.012;

  const personalityBias =
    bot.type === BotPersonality.BUDGET
      ? 0.015
      : bot.type === BotPersonality.QUALITY
        ? 0.012
        : bot.type === BotPersonality.LOYAL
          ? hasLoyaltyOption
            ? 0.022
            : 0.004
          : bot.type === BotPersonality.BULK
            ? 0.014
            : 0.018;

  const rawProbability =
    BOT_PURCHASE_CHANCE_BASE +
      elapsedFactor * 0.24 +
      activityFactor * 0.07 +
      assortmentFactor * 0.085 +
      shopExposureFactor * 0.055 +
      demandFactor * 0.058 +
      candidateStrengthFactor * 0.072 +
      timeOfDayBoost +
      personalityBias;

  return clamp(
    rawProbability * marketCooldownFactor * BOT_PURCHASE_CHANCE_MULTIPLIER,
    BOT_MIN_PURCHASE_CHANCE,
    BOT_MAX_PURCHASE_CHANCE,
  );
}

async function restockNpcShopsFromSupplier(
  now: Date,
  maxRestocks = MAX_NPC_SHOP_RESTOCKS_PER_SIMULATION,
) {
  const lowStockListings = await prisma.listing.findMany({
    where: {
      quantity: { lt: NPC_SHOP_RESTOCK_TARGET },
      shop: {
        status: "ACTIVE",
        owner: {
          OR: [
            { email: { endsWith: ORIGINAL_SYSTEM_SHOP_EMAIL_SUFFIX } },
            { email: { endsWith: LEGACY_SYSTEM_SHOP_EMAIL_SUFFIX } },
            { email: { endsWith: SYSTEM_SHOP_EMAIL_SUFFIX } },
          ],
          NOT: { email: BOT_WALLET_EMAIL },
        },
      },
    },
    orderBy: { updatedAt: "asc" },
    take: maxRestocks,
    select: { id: true },
  });

  let restocks = 0;
  for (const candidate of lowStockListings) {
    const restocked = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({
        where: { id: candidate.id },
        include: { shop: true, product: true },
      });
      if (!listing || listing.quantity >= NPC_SHOP_RESTOCK_TARGET) return false;

      const supplier = await tx.marketProductState.findUnique({
        where: { productId: listing.productId },
      });
      const owner = await tx.user.findUnique({
        where: { id: listing.shop.ownerId },
        select: { id: true, balance: true },
      });
      const inventory = await tx.inventory.findUnique({
        where: { userId_productId: { userId: listing.shop.ownerId, productId: listing.productId } },
      });

      if (!supplier || !owner || !inventory || supplier.supplierStock <= 0) return false;

      await tx.$queryRaw`SELECT "id" FROM "MarketProductState" WHERE "id" = ${supplier.id} FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${owner.id} FOR UPDATE`;

      const quantity = Math.min(
        NPC_SHOP_RESTOCK_BATCH_SIZE,
        NPC_SHOP_RESTOCK_TARGET - listing.quantity,
        supplier.supplierStock,
      );
      const totalCost = quantity * supplier.currentSupplierPrice;
      if (quantity <= 0 || owner.balance < totalCost) return false;

      await tx.marketProductState.update({
        where: { id: supplier.id },
        data: { supplierStock: { decrement: quantity } },
      });
      await tx.user.update({
        where: { id: owner.id },
        data: { balance: { decrement: totalCost } },
      });
      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: { increment: quantity },
          allocatedQuantity: { increment: quantity },
          averageUnitCost: supplier.currentSupplierPrice,
        },
      });
      await tx.listing.update({
        where: { id: listing.id },
        data: {
          quantity: { increment: quantity },
          active: true,
          soldOutAt: null,
        },
      });
      await recordBusinessExpense(tx, {
        userId: owner.id,
        category: BusinessLedgerEntryCategory.STOCK_PURCHASE,
        amount: totalCost,
        description: `NPC shop restock: ${listing.product.name}`,
        data: { source: "npc_shop_restock", productId: listing.productId, quantity, restockedAt: now.toISOString() },
      });

      return true;
    });
    if (restocked) restocks += 1;
  }

  return restocks;
}

async function normalizeNpcShopPrices() {
  const listings = await prisma.listing.findMany({
    where: {
      shop: {
        owner: {
          OR: [
            { email: { endsWith: ORIGINAL_SYSTEM_SHOP_EMAIL_SUFFIX } },
            { email: { endsWith: LEGACY_SYSTEM_SHOP_EMAIL_SUFFIX } },
            { email: { endsWith: SYSTEM_SHOP_EMAIL_SUFFIX } },
          ],
          NOT: { email: BOT_WALLET_EMAIL },
        },
      },
    },
    select: { id: true, price: true, product: { select: { basePrice: true, marketState: { select: { marketAveragePrice: true } } } } },
  });

  await Promise.all(
    listings.flatMap((listing) => {
      const referencePrice = Math.max(listing.product.basePrice, listing.product.marketState?.marketAveragePrice ?? 0);
      const maximumPrice = Math.round(referencePrice * MAX_NPC_LISTING_PRICE_MULTIPLIER);
      return listing.price > maximumPrice
        ? [prisma.listing.update({ where: { id: listing.id }, data: { price: maximumPrice } })]
        : [];
    }),
  );
}

/**
 * Removes stock from the old demo bot shops once. After this reset, bot shops
 * can only receive stock through the same paid supplier transaction as players.
 */
export async function resetNpcShopStockForSharedSupplier() {
  await prisma.worldState.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global" },
  });

  const npcOwners = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: ORIGINAL_SYSTEM_SHOP_EMAIL_SUFFIX } },
        { email: { endsWith: LEGACY_SYSTEM_SHOP_EMAIL_SUFFIX } },
        { email: { endsWith: SYSTEM_SHOP_EMAIL_SUFFIX } },
      ],
      NOT: { email: BOT_WALLET_EMAIL },
    },
    select: { id: true },
  });
  if (npcOwners.length === 0) return false;

  const ownerIds = npcOwners.map((owner) => owner.id);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "WorldState" WHERE "id" = 'global' FOR UPDATE`;
    const existingReset = await tx.businessLedgerEntry.findFirst({
      where: { description: NPC_SHOP_STOCK_RESET_MARKER },
      select: { id: true },
    });
    if (existingReset) return false;

    await tx.listing.updateMany({
      where: { shop: { ownerId: { in: ownerIds } } },
      data: { quantity: 0, active: false, soldOutAt: new Date() },
    });
    await tx.inventory.updateMany({
      where: { userId: { in: ownerIds } },
      data: { quantity: 0, allocatedQuantity: 0 },
    });
    await tx.businessLedgerEntry.createMany({
      data: ownerIds.map((userId) => ({
        userId,
        type: BusinessLedgerEntryType.EXPENSE,
        category: BusinessLedgerEntryCategory.OTHER_EXPENSE,
        amount: 0,
        description: NPC_SHOP_STOCK_RESET_MARKER,
        data: { source: "npc_shared_supplier_reset" },
      })),
    });
    return true;
  });
}

/**
 * Runs the one-time reset and immediately starts a small, paid bot-shop refill.
 * Subsequent calls do nothing here; normal simulation handles later refills.
 */
export async function prepareNpcShopsForSharedSupplier(now: Date) {
  const reset = await resetNpcShopStockForSharedSupplier();
  if (!reset) return 0;

  const botListingCount = await prisma.listing.count({
    where: {
      shop: {
        status: "ACTIVE",
        owner: {
          OR: [
            { email: { endsWith: ORIGINAL_SYSTEM_SHOP_EMAIL_SUFFIX } },
            { email: { endsWith: LEGACY_SYSTEM_SHOP_EMAIL_SUFFIX } },
            { email: { endsWith: SYSTEM_SHOP_EMAIL_SUFFIX } },
          ],
          NOT: { email: BOT_WALLET_EMAIL },
        },
      },
    },
  });

  return restockNpcShopsFromSupplier(now, Math.max(botListingCount, 1));
}

function getDynamicBotCooldownMs({
  bot,
  marketHeat,
  averageDemand,
  candidateCount,
}: {
  bot: ActiveBotRecord;
  marketHeat: number;
  averageDemand: number;
  candidateCount: number;
}) {
  const baseByPersonality =
    bot.type === BotPersonality.BULK
      ? 7 * 60_000
      : bot.type === BotPersonality.LOYAL
        ? 6 * 60_000
        : bot.type === BotPersonality.BUDGET
          ? 5.5 * 60_000
          : bot.type === BotPersonality.QUALITY
            ? 7 * 60_000
            : 6 * 60_000;
  const activityModifier = clamp(bot.activityLevel / 110, 0.45, 1.05);
  const marketHeatModifier = clamp(1 + marketHeat * 0.55, 1, 1.55);
  const demandModifier = clamp(1 - (averageDemand - 1) * 0.14, 0.86, 1.18);
  const assortmentModifier = clamp(1 - Math.min(candidateCount, 35) / 180, 0.82, 1.04);
  const randomJitter = 1 + Math.random() * 0.55;

  const rawCooldown = Math.round(
    baseByPersonality *
      (1 / activityModifier) *
      marketHeatModifier *
      demandModifier *
      assortmentModifier *
      randomJitter,
  );

  return Math.round(clamp(rawCooldown * 0.42, BOT_MIN_COOLDOWN_MS, BOT_MAX_COOLDOWN_MS));
}

function getBotShopActivityProfile({
  listingCount,
  totalStock,
  totalSales,
}: {
  listingCount: number;
  totalStock: number;
  totalSales: number;
}) {
  const shopSizeScore =
    listingCount * 1.2 +
    Math.min(totalStock, 220) / 14 +
    Math.log10(Math.max(1, totalSales + 1)) * 6;

  if (shopSizeScore >= 28) {
    return {
      multiplier: BOT_ACTIVITY_BIG_SHOP_MULTIPLIER,
      hourlyCap: BOT_MAX_PURCHASES_BIG_SHOP_PER_HOUR,
      dailyCap: BOT_MAX_PURCHASES_BIG_SHOP_PER_DAY,
    };
  }

  if (shopSizeScore >= 13) {
    return {
      multiplier: BOT_ACTIVITY_MEDIUM_SHOP_MULTIPLIER,
      hourlyCap: BOT_MAX_PURCHASES_MEDIUM_SHOP_PER_HOUR,
      dailyCap: BOT_MAX_PURCHASES_MEDIUM_SHOP_PER_DAY,
    };
  }

  return {
    multiplier: BOT_ACTIVITY_SMALL_SHOP_MULTIPLIER,
    hourlyCap: BOT_MAX_PURCHASES_SMALL_SHOP_PER_HOUR,
    dailyCap: BOT_MAX_PURCHASES_SMALL_SHOP_PER_DAY,
  };
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
      category === ProductCategory.MUSLIM_CLOTHING_AND_APPAREL ||
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

  if (ratio <= 0.92) {
    return personality === BotPersonality.BUDGET || personality === BotPersonality.BULK ? 1.18 : 1.08;
  }

  if (ratio <= 1.02) {
    return 1;
  }

  if (ratio <= 1.12) {
    switch (personality) {
      case BotPersonality.BUDGET:
        return 0.24;
      case BotPersonality.BULK:
        return 0.18;
      case BotPersonality.QUALITY:
        return 0.62;
      case BotPersonality.LOYAL:
        return 0.46;
      default:
        return 0.36;
    }
  }

  if (ratio <= 1.25) {
    switch (personality) {
      case BotPersonality.BUDGET:
        return 0.025;
      case BotPersonality.BULK:
        return 0.018;
      case BotPersonality.QUALITY:
        return listing.shop.rating >= 4.7 ? 0.16 : 0.08;
      case BotPersonality.LOYAL:
        return loyaltyShopId === listing.shop.id ? 0.09 : 0.04;
      default:
        return 0.045;
    }
  }

  if (ratio <= 1.45 && personality === BotPersonality.QUALITY && listing.shop.rating >= 4.85) {
    return 0.018;
  }

  if (ratio <= 1.4 && personality === BotPersonality.RANDOM) {
    return 0.004;
  }

  return personality === BotPersonality.RANDOM ? 0.0008 : 0.0001;
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
  const recentSalesPenalty = clamp(1 - recentBotSalesForShop * 0.16, 0.38, 1);
  const assortmentBoost = shopBreadthScore * 5;
  const maturityFactor = clamp(
    0.34 +
      Math.log10(Math.max(1, listing.shop.totalSales + 1)) * 0.26 +
      shopBreadthScore * 0.32 +
      clamp((listing.shop.rating - 3.2) / 3.2, 0, 0.22),
    0.3,
    1.18,
  );
  const randomnessBoost = 1 + Math.random() * 0.12;
  const overpriceDrag = overpriceRatio > 1 ? clamp(1 / overpriceRatio ** 5, 0.006, 1) : 1.04;
  const popularityFactor = clamp(0.78 + Math.log10(Math.max(1, listing.shop.totalSales + 1)) * 0.16, 0.78, 1.28);
  const premiumFit = clamp(1 - Math.abs(overpriceRatio - 1.18), 0.2, 1.1);
  const valueFit = clamp(referencePrice / Math.max(listing.price, 1), 0.15, 1.4);
  const bulkValueFit =
    listing.quantity >= 4
      ? clamp(valueFit * (1 + Math.min(listing.quantity, 18) / 36), 0.25, 2)
      : clamp(valueFit * 0.75, 0.12, 1.35);

  switch (personality) {
    case BotPersonality.BUDGET:
      return (
        affordability * 30 +
        relativeDealScore * 36 +
        valueFit * 22 +
        stockFactor * 0.9 +
        demandBoost +
        assortmentBoost * 0.8 +
        loyaltyFactor * 0.35
      ) *
        categoryAffinity *
        recentSalesPenalty *
        maturityFactor *
        randomnessBoost *
        priceSensitivity *
        overpriceDrag *
        popularityFactor;
    case BotPersonality.QUALITY:
      return (
        ratingFactor * 4 +
        stockFactor * 0.6 +
        premiumFit * 34 +
        relativeDealScore * 7 +
        affordability * 2 +
        demandBoost +
        assortmentBoost * 0.8 +
        loyaltyFactor * 0.65
      ) *
        categoryAffinity *
        recentSalesPenalty *
        maturityFactor *
        randomnessBoost *
        priceSensitivity *
        overpriceDrag *
        popularityFactor;
    case BotPersonality.LOYAL:
      return (
        loyaltyFactor +
        ratingFactor * 1.8 +
        stockFactor * 1.2 +
        relativeDealScore * 16 +
        demandBoost * 0.6 +
        assortmentBoost
      ) *
        categoryAffinity *
        recentSalesPenalty *
        maturityFactor *
        randomnessBoost *
        priceSensitivity *
        overpriceDrag *
        popularityFactor;
    case BotPersonality.BULK:
      return (
        stockFactor * 3.4 +
        bulkValueFit * 24 +
        affordability * 18 +
        relativeDealScore * 18 +
        demandBoost * 0.7 +
        assortmentBoost * 1.15 +
        loyaltyFactor
      ) *
        categoryAffinity *
        recentSalesPenalty *
        maturityFactor *
        randomnessBoost *
        priceSensitivity *
        overpriceDrag *
        popularityFactor;
    default:
      return (
        affordability * 9 +
        ratingFactor * 1.4 +
        relativeDealScore * 14 +
        stockFactor +
        demandBoost +
        assortmentBoost +
        Math.random() * 12
      ) *
        categoryAffinity *
        recentSalesPenalty *
        maturityFactor *
        priceSensitivity *
        overpriceDrag *
        popularityFactor;
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

function getBotPurchaseNotificationMessage({
  bot,
  shopName,
  productName,
  quantity,
  totalPrice,
  profit,
  currencyCode,
}: {
  bot: Pick<ActiveBotRecord, "displayName" | "type">;
  shopName: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  profit: number;
  currencyCode: string;
}) {
  const totalLabel = formatCurrency(totalPrice, currencyCode);
  const profitLabel = formatCurrency(profit, currencyCode);

  switch (bot.type) {
    case BotPersonality.BUDGET:
      return `${bot.displayName} found a good deal and bought ${quantity}x ${productName} from ${shopName}. Revenue ${totalLabel}. Profit ${profitLabel}.`;
    case BotPersonality.QUALITY:
      return `${bot.displayName} chose your quality stock: ${quantity}x ${productName}. Revenue ${totalLabel}. Profit ${profitLabel}.`;
    case BotPersonality.BULK:
      return `${bot.displayName} made a bulk buy: ${quantity}x ${productName} from ${shopName}. Revenue ${totalLabel}. Profit ${profitLabel}.`;
    case BotPersonality.LOYAL:
      return `${bot.displayName} came back to your shop and bought ${quantity}x ${productName}. Revenue ${totalLabel}. Profit ${profitLabel}.`;
    default:
      return `${bot.displayName} visited ${shopName} and bought ${quantity}x ${productName}. Revenue ${totalLabel}. Profit ${profitLabel}.`;
  }
}

async function runAutoRestock(now: Date, userId?: string): Promise<AutoRestockCycleResult[]> {
  const results: AutoRestockCycleResult[] = [];
  const activeSubscriptions = await prisma.autoRestockSubscription.findMany({
    where: {
      status: AutoRestockSubscriptionStatus.ACTIVE,
      ...(userId ? { userId } : {}),
    },
    select: {
      id: true,
      userId: true,
      plan: true,
      dailyCostCents: true,
      nextChargeAt: true,
      lastChargedAt: true,
      lastRestockAt: true,
      restockIntervalMinutes: true,
      fullAccessEnabled: true,
      startedAt: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          currencyCode: true,
          balance: true,
          deletedAt: true,
          securitySetupCompleted: true,
          shop: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (userId && activeSubscriptions.length === 0) {
    return [
      {
        status: "no_active_subscription",
        message: "No active Auto Restocker subscription.",
      },
    ];
  }

  for (const subscription of activeSubscriptions) {
    const user = subscription.user;
    if (!user || user.deletedAt || !user.securitySetupCompleted || !user.shop || user.shop.status !== "ACTIVE") {
      results.push({
        status: "no_active_subscription",
        message: "Auto Restocker needs an active shop and completed security setup.",
      });
      continue;
    }

    const retiredRequests = await prisma.autoRestockRequest.updateMany({
      where: {
        userId: user.id,
        status: "PENDING",
      },
      data: {
        status: "SKIPPED",
        decidedAt: now,
        failureReason: "Replaced by automatic Auto Restocker",
      },
    });
    if (retiredRequests.count > 0) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          message: "An old restock request was cleared. Your Restocker now buys eligible stock automatically.",
          createdAt: now,
        },
      });
    }

    const renewalCostCents = getAutoRestockRenewalCostCents(subscription.plan, subscription.fullAccessEnabled);
    const renewalAnchor = subscription.lastChargedAt ?? subscription.startedAt ?? subscription.createdAt;
    const expectedDailyRenewalAt = addHours(renewalAnchor, AUTO_RESTOCK_RENEWAL_HOURS);
    let nextChargeAt = subscription.nextChargeAt;

    // Existing 48-hour subscriptions move forward without an immediate catch-up charge.
    if (nextChargeAt > expectedDailyRenewalAt) {
      nextChargeAt = expectedDailyRenewalAt <= now ? addHours(now, AUTO_RESTOCK_RENEWAL_HOURS) : expectedDailyRenewalAt;
      await prisma.autoRestockSubscription.updateMany({
        where: { id: subscription.id, nextChargeAt: subscription.nextChargeAt },
        data: { nextChargeAt, dailyCostCents: renewalCostCents },
      });
    }

    if (nextChargeAt <= now) {
      const renewalResult = await prisma.$transaction(async (tx) => {
        // Claim the renewal first so concurrent simulation ticks cannot charge twice.
        const renewalClaim = await tx.autoRestockSubscription.updateMany({
          where: {
            id: subscription.id,
            status: AutoRestockSubscriptionStatus.ACTIVE,
            nextChargeAt: { lte: now },
          },
          data: {
            lastChargedAt: now,
            nextChargeAt: addHours(now, AUTO_RESTOCK_RENEWAL_HOURS),
            dailyCostCents: renewalCostCents,
          },
        });
        if (renewalClaim.count !== 1) {
          return "already_claimed" as const;
        }

        const balanceUpdate = await tx.user.updateMany({
          where: { id: user.id, balance: { gte: renewalCostCents } },
          data: { balance: { decrement: renewalCostCents } },
        });
        if (balanceUpdate.count !== 1) {
          await tx.autoRestockSubscription.update({
            where: { id: subscription.id },
            data: { status: AutoRestockSubscriptionStatus.CANCELLED },
          });
          await tx.notification.create({
            data: {
              userId: user.id,
              type: NotificationType.SYSTEM,
              message: `Auto Restock cancelled: insufficient balance for 24-hour renewal (${formatCurrency(
                renewalCostCents,
                user.currencyCode,
              )}).`,
              createdAt: now,
            },
          });
          return "cancelled" as const;
        }

        await recordBusinessExpense(tx, {
          userId: user.id,
          category: BusinessLedgerEntryCategory.SUBSCRIPTION_FEE,
          amount: renewalCostCents,
          description: `${getPlanMeta(subscription.plan).name} Auto Restock 24-hour fee`,
          data: {
            source: "auto_restock_24_hour_charge",
            subscriptionId: subscription.id,
            plan: subscription.plan,
            fullAccessEnabled: subscription.fullAccessEnabled,
          },
          createdAt: now,
        });
        await tx.notification.create({
          data: {
            userId: user.id,
            type: NotificationType.SYSTEM,
            message: `${getPlanMeta(subscription.plan).name} Auto Restock 24-hour renewal charged: ${formatCurrency(
              renewalCostCents,
              user.currencyCode,
            )}.`,
            createdAt: now,
          },
        });
        return "charged" as const;
      });

      if (renewalResult === "cancelled") {
        results.push({
          status: "subscription_cancelled",
          message: "Auto Restock subscription cancelled because renewal balance was too low.",
        });
        continue;
      }
    }

    if (!isRestockCycleDue(subscription.plan, subscription, now)) {
      results.push({
        status: "not_due",
        message: "Next restock check is still counting down.",
      });
      continue;
    }

    const cycleDueAt = new Date(now.getTime() - getRestockCycleMs(subscription.plan, subscription.restockIntervalMinutes));
    const cycleClaim = await prisma.autoRestockSubscription.updateMany({
      where: {
        id: subscription.id,
        status: AutoRestockSubscriptionStatus.ACTIVE,
        OR: [{ lastRestockAt: null }, { lastRestockAt: { lte: cycleDueAt } }],
      },
      data: { lastRestockAt: now },
    });
    if (cycleClaim.count !== 1) {
      results.push({ status: "not_due", message: "Next restock check is still counting down." });
      continue;
    }

    const soldOutListings = await prisma.listing.findMany({
      where: {
        shopId: user.shop.id,
        quantity: { lte: 0 },
        isPaused: false,
      },
      select: {
        id: true,
        productId: true,
        product: {
          select: {
            name: true,
            category: true,
            marketState: {
              select: {
                currentSupplierPrice: true,
                supplierStock: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "asc" },
      take: subscription.plan === AutoRestockPlan.MAX ? 160 : 120,
    });

    if (soldOutListings.length === 0) {
      results.push({
        status: "no_sold_out_items",
        message: "No sold-out items found.",
      });
      continue;
    }

    const withStock = soldOutListings.filter((listing) => sanitizeStockCount(listing.product.marketState?.supplierStock ?? 0) > 0);
    if (withStock.length === 0) {
      results.push({
        status: "no_supplier_stock",
        message: "Sold-out items were found, but supplier stock is unavailable.",
      });
      continue;
    }

    const coveragePercent = getRestockCoveragePercent(subscription.plan);
    const targetCount = Math.max(1, Math.min(withStock.length, Math.ceil(withStock.length * coveragePercent)));
    const selectedListings =
      coveragePercent >= 1
        ? withStock
        : withStock
            .slice()
            .sort(() => Math.random() - 0.5)
            .slice(0, targetCount);

    const defaultQty = getPlanMeta(subscription.plan).defaultQuantity;
    let requestItems = selectedListings
      .map((listing) => {
        const supplierStock = sanitizeStockCount(listing.product.marketState?.supplierStock ?? 0);
        if (supplierStock <= 0) return null;
        const baseQty =
          subscription.plan === AutoRestockPlan.SIMPLE
            ? 1
            : subscription.plan === AutoRestockPlan.PRO
              ? randomIntInclusive(Math.max(1, defaultQty - 1), defaultQty + 1)
              : Math.max(defaultQty, randomIntInclusive(defaultQty, defaultQty + 2));
        const quantity = Math.min(Math.max(1, baseQty), supplierStock);
        const unitPrice = Math.max(1, listing.product.marketState?.currentSupplierPrice ?? 1);
        return {
          listingId: listing.id,
          productId: listing.productId,
          quantity,
          unitPrice,
          lineTotal: quantity * unitPrice,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    let affordableRunningTotal = 0;
    requestItems = requestItems.filter((item) => {
      if (affordableRunningTotal + item.lineTotal > user.balance) {
        return false;
      }
      affordableRunningTotal += item.lineTotal;
      return true;
    });

    if (requestItems.length === 0) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          message: `${getPlanMeta(subscription.plan).name} Restocker found sold-out items, but balance was too low for an affordable proposal.`,
          createdAt: now,
        },
      });
      results.push({
        status: "insufficient_balance",
        message: "Sold-out items were found, but balance was too low for an affordable restock.",
      });
      continue;
    }

    const estimatedCost = requestItems.reduce((sum, item) => sum + item.lineTotal, 0);
    if (estimatedCost <= 0) {
      results.push({
        status: "insufficient_balance",
        message: "Restock check could not build a payable proposal.",
      });
      continue;
    }

    {
      let autoPurchaseCompleted = false;
      let insufficientBalance = false;
      try {
        await prisma.$transaction(async (tx) => {
        let payableTotal = 0;
        const resolved: Array<{
          listingId: string;
          productId: string;
          productName: string;
          quantity: number;
          unitPrice: number;
          lineTotal: number;
        }> = [];

        for (const item of requestItems) {
          const listing = await tx.listing.findUnique({
            where: { id: item.listingId },
            select: {
              id: true,
              productId: true,
              product: {
                select: {
                  name: true,
                  marketState: {
                    select: {
                      currentSupplierPrice: true,
                      supplierStock: true,
                    },
                  },
                },
              },
              shop: {
                select: {
                  ownerId: true,
                },
              },
            },
          });

          if (!listing || listing.shop.ownerId !== user.id) {
            continue;
          }

          const supplierStock = sanitizeStockCount(listing.product.marketState?.supplierStock ?? 0);
          const quantity = Math.min(item.quantity, supplierStock);
          if (quantity <= 0) {
            continue;
          }

          const unitPrice = Math.max(1, listing.product.marketState?.currentSupplierPrice ?? item.unitPrice);
          const lineTotal = unitPrice * quantity;

          // Reserve supplier stock inside this transaction before charging the shop.
          const stockReservation = await tx.marketProductState.updateMany({
            where: { productId: listing.productId, supplierStock: { gte: quantity } },
            data: { supplierStock: { decrement: quantity } },
          });
          if (stockReservation.count !== 1) {
            continue;
          }

          payableTotal += lineTotal;
          resolved.push({
            listingId: listing.id,
            productId: listing.productId,
            productName: listing.product.name,
            quantity,
            unitPrice,
            lineTotal,
          });
        }

        if (resolved.length === 0) {
          return;
        }

        const balanceUpdate = await tx.user.updateMany({
          where: { id: user.id, balance: { gte: payableTotal } },
          data: { balance: { decrement: payableTotal } },
        });
        if (balanceUpdate.count !== 1) {
          throw new Error("AUTO_RESTOCK_INSUFFICIENT_BALANCE");
        }

        await recordBusinessExpense(tx, {
          userId: user.id,
          category: BusinessLedgerEntryCategory.AUTO_RESTOCK_PURCHASE,
          amount: payableTotal,
          description: `${getPlanMeta(subscription.plan).name} Auto Restock automatic purchase`,
          data: {
            source: "auto_restock_automatic_purchase",
            subscriptionId: subscription.id,
            plan: subscription.plan,
          },
          createdAt: now,
        });

        for (const item of resolved) {
          const inventory = await tx.inventory.upsert({
            where: {
              userId_productId: {
                userId: user.id,
                productId: item.productId,
              },
            },
            update: {},
            create: {
              userId: user.id,
              productId: item.productId,
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

          const nextInventoryQuantity = inventory.quantity + item.quantity;
          const currentValue = inventory.averageUnitCost * inventory.quantity;
          const nextValue = currentValue + item.unitPrice * item.quantity;
          const nextAverage =
            nextInventoryQuantity > 0 ? Math.round(nextValue / nextInventoryQuantity) : item.unitPrice;

          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: {
                increment: item.quantity,
              },
              allocatedQuantity: sanitizeStockCount(inventory.allocatedQuantity + item.quantity),
              averageUnitCost: nextAverage,
            },
          });

          await tx.listing.update({
            where: { id: item.listingId },
            data: {
              quantity: {
                increment: item.quantity,
              },
              active: true,
              soldOutAt: null,
              lastAutoRestockedAt: now,
            },
          });
        }

        const itemSummary =
          resolved.length === 1
            ? resolved[0].productName
            : `${resolved[0].productName} and ${resolved.length - 1} more`;

        await tx.notification.create({
          data: {
            userId: user.id,
            type: NotificationType.SYSTEM,
            message: `${getPlanMeta(subscription.plan).name} Restocker bought/restocked ${itemSummary} for ${formatCurrency(
              payableTotal,
              user.currencyCode,
            )}.`,
            createdAt: now,
          },
        });
          autoPurchaseCompleted = true;
        });
      } catch (error) {
        if (!(error instanceof Error) || error.message !== "AUTO_RESTOCK_INSUFFICIENT_BALANCE") {
          throw error;
        }
        insufficientBalance = true;
      }
      if (insufficientBalance) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: NotificationType.SYSTEM,
            message: `${getPlanMeta(subscription.plan).name} Restocker found eligible items, but your balance was too low to buy them.`,
            createdAt: now,
          },
        });
      }
      results.push({
        status: autoPurchaseCompleted ? "auto_purchase_completed" : insufficientBalance ? "insufficient_balance" : "auto_purchase_waiting",
        message: autoPurchaseCompleted
          ? `${getPlanMeta(subscription.plan).name} Restocker bought eligible items automatically.`
          : insufficientBalance
            ? "Restocker found items, but your balance was too low to buy them."
            : "Restocker checked eligible items but supplier stock changed before it could buy.",
        itemCount: requestItems.length,
        totalCostCents: estimatedCost,
      });
      continue;
    }
  }

  return results;
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
  const shouldRestockSupplierToday =
    !worldState.lastSimulatedAt ||
    worldState.lastSimulatedAt.toDateString() !== now.toDateString();
  await runSoldOutListingCleanup(now);

  const marketReadinessScore = clamp(
    elapsedSinceLastSimulationMs / (90 * 1000) +
      Math.random() * 0.35,
    0,
    1.35,
  );

  if (!force && worldState.lastSimulatedAt && marketReadinessScore < 0.08) {
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
        // The supplier starts each new day with a fair, fixed shared supply.
        supplierStock: shouldRestockSupplierToday ? 50 : clamp(state.supplierStock, 0, 50),
      },
    });
  }

  const initialNpcSupplierPurchases = await prepareNpcShopsForSharedSupplier(now);
  await runAutoRestock(now);
  const recurringNpcSupplierPurchases = await restockNpcShopsFromSupplier(now);
  await normalizeNpcShopPrices();

  let botWallet = await prisma.user.findUnique({
    where: { email: BOT_WALLET_EMAIL },
    select: {
      id: true,
      balance: true,
    },
  });

  if (!botWallet) {
    botWallet = await prisma.user.create({
      data: {
        email: BOT_WALLET_EMAIL,
        username: "bot_market",
        displayName: "Profit Planet Bot Market",
        passwordHash: hashPassword(`internal-${crypto.randomUUID()}`),
        balance: BOT_WALLET_TARGET_BALANCE,
        hasCompletedOnboarding: true,
        playerMode: "ADVANCED",
        playerModeConfirmed: true,
      },
      select: { id: true, balance: true },
    });
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

  const cappedHourlyBotSales = await prisma.order.groupBy({
    by: ["shopId"],
    where: {
      buyerId: botWallet.id,
      createdAt: {
        gte: subMinutes(now, BOT_SHOP_PURCHASE_CAP_LOOKBACK_MINUTES),
      },
    },
    _count: {
      _all: true,
    },
  });

  const cappedDailyBotSales = await prisma.order.groupBy({
    by: ["shopId"],
    where: {
      buyerId: botWallet.id,
      createdAt: {
        gte: subMinutes(now, BOT_SHOP_DAILY_CAP_LOOKBACK_MINUTES),
      },
    },
    _count: {
      _all: true,
    },
  });

  const recentBotSalesByShop = new Map(
    recentBotSales.map((entry) => [entry.shopId, entry._count._all]),
  );
  const hourlyBotSalesByShop = new Map(
    cappedHourlyBotSales.map((entry) => [entry.shopId, entry._count._all]),
  );
  const dailyBotSalesByShop = new Map(
    cappedDailyBotSales.map((entry) => [entry.shopId, entry._count._all]),
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
  const shopSizeStatsByShop = new Map(
    shopListingDepth.map((entry) => [
      entry.shopId,
      {
        listingCount: entry._count._all,
        totalStock: entry._sum.quantity ?? 0,
      },
    ]),
  );

  const allCandidateListings = (await prisma.listing.findMany({
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
  const candidateListings = allCandidateListings.filter((listing) => {
    const hourlySales = hourlyBotSalesByShop.get(listing.shopId) ?? 0;
    const dailySales = dailyBotSalesByShop.get(listing.shopId) ?? 0;
    const shopSizeStats = shopSizeStatsByShop.get(listing.shopId);
    const shopActivity = getBotShopActivityProfile({
      listingCount: shopSizeStats?.listingCount ?? 1,
      totalStock: shopSizeStats?.totalStock ?? listing.quantity,
      totalSales: listing.shop.totalSales,
    });
    return hourlySales < shopActivity.hourlyCap && dailySales < shopActivity.dailyCap;
  });

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
              ? 1.38
              : bot.type === BotPersonality.QUALITY
                ? 1.42
                : bot.type === BotPersonality.LOYAL
                  ? 1.34
                  : 1.25;

          return option.score >= 1.5 && overpriceRatio <= hardCap;
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
      const shopActivityMultiplier =
        affordableListings.length > 0
          ? affordableListings.reduce((sum, listing) => {
              const shopSizeStats = shopSizeStatsByShop.get(listing.shopId);
              return (
                sum +
                getBotShopActivityProfile({
                  listingCount: shopSizeStats?.listingCount ?? 1,
                  totalStock: shopSizeStats?.totalStock ?? listing.quantity,
                  totalSales: listing.shop.totalSales,
                }).multiplier
              );
            }, 0) / affordableListings.length
          : BOT_ACTIVITY_SMALL_SHOP_MULTIPLIER;
      const elapsedSinceLastAttemptMs = Math.max(
        15_000,
        now.getTime() - (bot.lastAttemptedAt ?? bot.createdAt).getTime(),
      );
      const attemptProbability =
        affordableListings.length > 0
          ? clamp(
              getBotAttemptProbability({
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
              }) * shopActivityMultiplier,
              BOT_MIN_PURCHASE_CHANCE,
              BOT_MAX_PURCHASE_CHANCE,
            )
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

  const selectedBotPlans = botPlans
    .filter((plan) => {
      if (plan.weightedSelection.length === 0) {
        return false;
      }

      const avgDemand =
        plan.affordableListings.length > 0
          ? plan.affordableListings.reduce(
              (sum, listing) => sum + (listing.product.marketState?.demandScore ?? 1),
              0,
            ) / plan.affordableListings.length
          : 1;
      const dynamicCooldownMs = getDynamicBotCooldownMs({
        bot: plan.bot,
        marketHeat: clamp(recentMarketSalesCount / 10, 0, 1),
        averageDemand: avgDemand,
        candidateCount: plan.affordableListings.length,
      });
      const elapsedSinceLastAttemptMs = Math.max(
        0,
        now.getTime() - (plan.bot.lastAttemptedAt ?? plan.bot.createdAt).getTime(),
      );

      if (elapsedSinceLastAttemptMs < dynamicCooldownMs) {
        return false;
      }

      return Math.random() < plan.attemptProbability;
    })
    .slice(0, MAX_BOT_PURCHASES_PER_SIMULATION);

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
            averageUnitCost: true,
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
        const costUnitPrice = getSaleCostUnitPrice({
          inventoryAverageUnitCost: inventory.averageUnitCost,
          productBasePrice: freshListing.product.basePrice,
        });
        const lineProfit = calculateProfit({
          sellingUnitPrice: freshListing.price,
          costUnitPrice,
          quantity: selectedQuantity,
        });

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
            costUnitPrice,
            lineTotal: totalPrice,
            lineProfit,
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
            soldOutAt: remainingListingQuantity > 0 ? null : attemptedAt,
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
            message: getBotPurchaseNotificationMessage({
              bot,
              shopName: freshListing.shop.name,
              productName: freshListing.product.name,
              quantity: selectedQuantity,
              totalPrice,
              profit: lineProfit,
              currencyCode: seller.currencyCode,
            }),
            createdAt: attemptedAt,
          },
        });

        if (remainingListingQuantity <= 3) {
          await tx.notification.create({
            data: {
              userId: seller.id,
              type: NotificationType.LOW_STOCK,
              message: `${freshListing.product.name}: ${
                remainingListingQuantity <= 0
                  ? "You don't have any more of this left."
                  : `Low stock remaining: ${remainingListingQuantity} left`
              }.`,
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
        hourlyBotSalesByShop.set(selectedShopId, (hourlyBotSalesByShop.get(selectedShopId) ?? 0) + 1);
        dailyBotSalesByShop.set(selectedShopId, (dailyBotSalesByShop.get(selectedShopId) ?? 0) + 1);
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
            npcSupplierPurchases:
              initialNpcSupplierPurchases + recurringNpcSupplierPurchases,
            systemShops: await prisma.shop.findMany({
              where: {
                owner: {
                  OR: [
                    { email: { endsWith: ORIGINAL_SYSTEM_SHOP_EMAIL_SUFFIX } },
                    { email: { endsWith: LEGACY_SYSTEM_SHOP_EMAIL_SUFFIX } },
                    { email: { endsWith: SYSTEM_SHOP_EMAIL_SUFFIX } },
                  ],
                  NOT: { email: BOT_WALLET_EMAIL },
                },
              },
              orderBy: { name: "asc" },
              select: { name: true },
            }),
            dishwashingLiquid: await prisma.product.findFirst({
              where: { name: "Dishwashing Liquid" },
              select: {
                marketState: { select: { supplierStock: true } },
                listings: {
                  where: {
                    quantity: { gt: 0 },
                    shop: {
                      owner: {
                        OR: [
                          { email: { endsWith: ORIGINAL_SYSTEM_SHOP_EMAIL_SUFFIX } },
                          { email: { endsWith: LEGACY_SYSTEM_SHOP_EMAIL_SUFFIX } },
                          { email: { endsWith: SYSTEM_SHOP_EMAIL_SUFFIX } },
                        ],
                        NOT: { email: BOT_WALLET_EMAIL },
                      },
                    },
                  },
                  select: { quantity: true, shop: { select: { name: true } } },
                },
              },
            }),
            snapshots: debugSnapshots,
          },
        }
      : {}),
  };
}
