import type { ProductCategory } from "@prisma/client";

import { CATALOG_SOURCE } from "@/lib/catalog-source";
import { prisma } from "@/lib/prisma";
import { clamp } from "@/lib/utils";

export const SUPPORTED_CURRENCY_CODES = ["AUD", "USD", "GBP", "PKR", "INR", "AED", "SAR", "TRY"] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCY_CODES)[number];

type PriceProfileMetadata = {
  currencyCode: SupportedCurrencyCode;
  label: string;
  regionName: string;
  locale: string;
  fractionDigits: number;
  supplierRatio: number;
};

type CatalogPriceInput = {
  name: string;
  category: ProductCategory;
  subcategory?: string | null;
  unitLabel: string;
  basePrice: number;
  supplierRatio?: number;
};

type RegionalPricing = {
  currencyCode: SupportedCurrencyCode;
  unitLabel: string;
  basePrice: number;
  supplierPrice: number;
  marketAveragePrice: number;
};

const profileMetadata: Record<SupportedCurrencyCode, PriceProfileMetadata> = {
  AUD: {
    currencyCode: "AUD",
    label: "AUD - Australia",
    regionName: "Australian",
    locale: "en-AU",
    fractionDigits: 2,
    supplierRatio: 0.72,
  },
  USD: {
    currencyCode: "USD",
    label: "USD - United States",
    regionName: "US",
    locale: "en-US",
    fractionDigits: 2,
    supplierRatio: 0.68,
  },
  GBP: {
    currencyCode: "GBP",
    label: "GBP - United Kingdom",
    regionName: "UK",
    locale: "en-GB",
    fractionDigits: 2,
    supplierRatio: 0.68,
  },
  PKR: {
    currencyCode: "PKR",
    label: "PKR - Pakistan",
    regionName: "Pakistani",
    locale: "en-PK",
    fractionDigits: 0,
    supplierRatio: 0.76,
  },
  INR: {
    currencyCode: "INR",
    label: "INR - India",
    regionName: "Indian",
    locale: "en-IN",
    fractionDigits: 0,
    supplierRatio: 0.76,
  },
  AED: {
    currencyCode: "AED",
    label: "AED - UAE / Gulf",
    regionName: "Gulf",
    locale: "en-AE",
    fractionDigits: 2,
    supplierRatio: 0.7,
  },
  SAR: {
    currencyCode: "SAR",
    label: "SAR - Saudi Arabia / Gulf",
    regionName: "Saudi",
    locale: "en-SA",
    fractionDigits: 2,
    supplierRatio: 0.7,
  },
  TRY: {
    currencyCode: "TRY",
    label: "TRY - Turkiye",
    regionName: "Turkish",
    locale: "tr-TR",
    fractionDigits: 2,
    supplierRatio: 0.74,
  },
};

const unitOverrides: Partial<Record<SupportedCurrencyCode, Partial<Record<string, string>>>> = {
  USD: {
    "per kg": "per lb",
  },
  GBP: {
    "per kg": "per kg",
  },
};

const regionalOverrides: Record<SupportedCurrencyCode, Record<string, number>> = {
  AUD: {
    Apples: 5.2,
    Bananas: 4.4,
    Oranges: 4.6,
    Milk: 1.9,
    Bread: 3.4,
    Eggs: 7.4,
    Chicken: 13.5,
    Beef: 22.5,
    "Beef Mince": 14.0,
    Lamb: 15.0,
    "Lamb Chops": 24.5,
    Shampoo: 7.0,
    "Basic Thobe": 44.99,
    "Premium Thobe": 94.99,
    "Basic Abaya": 89.0,
    "Premium Abaya": 119.99,
    "Embroidered Abaya": 149.99,
    "Formal Sherwani": 169.99,
    Phone: 799,
    Laptop: 1199,
  },
  USD: {
    Apples: 1.99,
    Bananas: 0.69,
    Oranges: 1.79,
    Milk: 1.15,
    Bread: 2.99,
    Eggs: 4.99,
    Chicken: 4.99,
    Beef: 8.99,
    "Beef Mince": 5.99,
    Lamb: 8.49,
    "Basic Thobe": 34.99,
    "Premium Thobe": 79.99,
    "Basic Abaya": 44.99,
    "Premium Abaya": 89.99,
    Phone: 699,
    Laptop: 999,
  },
  GBP: {
    Apples: 2.1,
    Bananas: 1.05,
    Oranges: 2.0,
    Milk: 1.25,
    Bread: 1.45,
    Eggs: 3.1,
    Chicken: 6.2,
    Beef: 9.5,
    "Beef Mince": 6.1,
    Lamb: 9.0,
    "Basic Thobe": 32.99,
    "Premium Thobe": 74.99,
    "Basic Abaya": 39.99,
    "Premium Abaya": 82.99,
    Phone: 649,
    Laptop: 899,
  },
  PKR: {
    Apples: 520,
    Bananas: 240,
    Oranges: 320,
    Mangoes: 420,
    Milk: 320,
    Bread: 180,
    Eggs: 520,
    Chicken: 980,
    "Chicken Mince": 1050,
    Beef: 1650,
    "Beef Mince": 1500,
    Lamb: 2200,
    Cheese: 2200,
    Shampoo: 650,
    "Basic Thobe": 3600,
    "Premium Thobe": 8200,
    "Embroidered Thobe": 10500,
    "Basic Shalwar Kameez": 3200,
    "Formal Shalwar Kameez": 7800,
    "Formal Sherwani": 22000,
    "Basic Abaya": 4200,
    "Premium Abaya": 9000,
    "Basic Hijab": 900,
    "Premium Hijab": 1800,
    Phone: 145000,
    Tablet: 85000,
    Laptop: 240000,
  },
  INR: {
    Apples: 180,
    Bananas: 70,
    Oranges: 110,
    Milk: 70,
    Bread: 55,
    Eggs: 95,
    Chicken: 260,
    Beef: 520,
    "Beef Mince": 500,
    Lamb: 720,
    Shampoo: 240,
    "Basic Thobe": 1800,
    "Premium Thobe": 4200,
    "Basic Abaya": 2200,
    "Premium Abaya": 5200,
    Phone: 45000,
    Laptop: 75000,
  },
  AED: {
    Apples: 8.95,
    Bananas: 5.95,
    Oranges: 7.95,
    Milk: 6.5,
    Bread: 5.5,
    Eggs: 14.5,
    Chicken: 24.0,
    Beef: 42.0,
    "Beef Mince": 32.0,
    Lamb: 44.0,
    "Basic Thobe": 95,
    "Premium Thobe": 220,
    "Basic Abaya": 120,
    "Premium Abaya": 260,
    Phone: 2499,
    Laptop: 3499,
  },
  SAR: {
    Apples: 8.5,
    Bananas: 5.5,
    Oranges: 7.5,
    Milk: 6.0,
    Bread: 4.5,
    Eggs: 13.5,
    Chicken: 22.0,
    Beef: 40.0,
    "Beef Mince": 30.0,
    Lamb: 42.0,
    "Basic Thobe": 90,
    "Premium Thobe": 210,
    "Basic Abaya": 110,
    "Premium Abaya": 250,
    Phone: 2399,
    Laptop: 3399,
  },
  TRY: {
    Apples: 65,
    Bananas: 85,
    Oranges: 55,
    Milk: 42,
    Bread: 15,
    Eggs: 95,
    Chicken: 220,
    Beef: 640,
    "Beef Mince": 580,
    Lamb: 720,
    Shampoo: 145,
    "Basic Thobe": 1200,
    "Premium Thobe": 2800,
    "Basic Abaya": 1500,
    "Premium Abaya": 3300,
    Phone: 32000,
    Laptop: 52000,
  },
};

const categoryMajorPriceRanges: Record<
  SupportedCurrencyCode,
  Record<ProductCategory, [number, number]>
> = {
  AUD: {
    FRUIT_AND_VEGETABLES: [0.99, 20],
    BAKERY_AND_GRAINS: [1.49, 9],
    PANTRY_AND_COOKING: [1.4, 15],
    DRINKS: [1.49, 10],
    MEAT_DAIRY_AND_PROTEIN: [3.5, 28],
    SNACKS_AND_SWEETS: [1.29, 12],
    KITCHEN_AND_COOKWARE: [4.99, 35],
    CLEANING_AND_PERSONAL_CARE: [1.9, 20],
    CLOTHING: [8.99, 190],
    HOME_AND_STORAGE: [7.99, 70],
    ELECTRONICS: [12.99, 1300],
    SCHOOL_AND_MISC: [1, 35],
  },
  USD: {
    FRUIT_AND_VEGETABLES: [0.49, 6],
    BAKERY_AND_GRAINS: [1.29, 6],
    PANTRY_AND_COOKING: [0.99, 10],
    DRINKS: [0.99, 7],
    MEAT_DAIRY_AND_PROTEIN: [2.49, 15],
    SNACKS_AND_SWEETS: [0.99, 9],
    KITCHEN_AND_COOKWARE: [3.99, 30],
    CLEANING_AND_PERSONAL_CARE: [1.49, 14],
    CLOTHING: [6.99, 140],
    HOME_AND_STORAGE: [5.99, 55],
    ELECTRONICS: [8.99, 1100],
    SCHOOL_AND_MISC: [0.79, 30],
  },
  GBP: {
    FRUIT_AND_VEGETABLES: [0.7, 5],
    BAKERY_AND_GRAINS: [0.9, 5],
    PANTRY_AND_COOKING: [0.7, 8],
    DRINKS: [0.8, 6],
    MEAT_DAIRY_AND_PROTEIN: [2, 13],
    SNACKS_AND_SWEETS: [0.7, 7],
    KITCHEN_AND_COOKWARE: [3, 25],
    CLEANING_AND_PERSONAL_CARE: [1, 12],
    CLOTHING: [5, 130],
    HOME_AND_STORAGE: [4, 45],
    ELECTRONICS: [7, 1000],
    SCHOOL_AND_MISC: [0.5, 25],
  },
  PKR: {
    FRUIT_AND_VEGETABLES: [80, 2200],
    BAKERY_AND_GRAINS: [120, 1200],
    PANTRY_AND_COOKING: [90, 2500],
    DRINKS: [120, 900],
    MEAT_DAIRY_AND_PROTEIN: [350, 3200],
    SNACKS_AND_SWEETS: [80, 1200],
    KITCHEN_AND_COOKWARE: [350, 5000],
    CLEANING_AND_PERSONAL_CARE: [120, 2500],
    CLOTHING: [600, 26000],
    HOME_AND_STORAGE: [400, 9000],
    ELECTRONICS: [900, 260000],
    SCHOOL_AND_MISC: [50, 4000],
  },
  INR: {
    FRUIT_AND_VEGETABLES: [30, 900],
    BAKERY_AND_GRAINS: [40, 500],
    PANTRY_AND_COOKING: [35, 900],
    DRINKS: [40, 350],
    MEAT_DAIRY_AND_PROTEIN: [90, 900],
    SNACKS_AND_SWEETS: [30, 500],
    KITCHEN_AND_COOKWARE: [150, 2500],
    CLEANING_AND_PERSONAL_CARE: [50, 900],
    CLOTHING: [250, 14000],
    HOME_AND_STORAGE: [200, 4500],
    ELECTRONICS: [500, 90000],
    SCHOOL_AND_MISC: [15, 1800],
  },
  AED: {
    FRUIT_AND_VEGETABLES: [2, 35],
    BAKERY_AND_GRAINS: [3, 18],
    PANTRY_AND_COOKING: [2.5, 35],
    DRINKS: [2.5, 18],
    MEAT_DAIRY_AND_PROTEIN: [8, 60],
    SNACKS_AND_SWEETS: [2, 25],
    KITCHEN_AND_COOKWARE: [8, 90],
    CLEANING_AND_PERSONAL_CARE: [4, 45],
    CLOTHING: [18, 450],
    HOME_AND_STORAGE: [15, 180],
    ELECTRONICS: [20, 4000],
    SCHOOL_AND_MISC: [2, 80],
  },
  SAR: {
    FRUIT_AND_VEGETABLES: [2, 35],
    BAKERY_AND_GRAINS: [2.5, 18],
    PANTRY_AND_COOKING: [2.5, 35],
    DRINKS: [2.5, 18],
    MEAT_DAIRY_AND_PROTEIN: [8, 60],
    SNACKS_AND_SWEETS: [2, 25],
    KITCHEN_AND_COOKWARE: [8, 90],
    CLEANING_AND_PERSONAL_CARE: [4, 45],
    CLOTHING: [18, 430],
    HOME_AND_STORAGE: [15, 180],
    ELECTRONICS: [20, 3900],
    SCHOOL_AND_MISC: [2, 80],
  },
  TRY: {
    FRUIT_AND_VEGETABLES: [15, 900],
    BAKERY_AND_GRAINS: [15, 450],
    PANTRY_AND_COOKING: [20, 1200],
    DRINKS: [20, 400],
    MEAT_DAIRY_AND_PROTEIN: [80, 900],
    SNACKS_AND_SWEETS: [15, 500],
    KITCHEN_AND_COOKWARE: [100, 3500],
    CLEANING_AND_PERSONAL_CARE: [35, 1200],
    CLOTHING: [250, 12000],
    HOME_AND_STORAGE: [150, 5000],
    ELECTRONICS: [400, 65000],
    SCHOOL_AND_MISC: [10, 1500],
  },
};

const categoryFallbackMultiplier: Record<SupportedCurrencyCode, Record<ProductCategory, number>> = {
  AUD: makeMultiplierProfile(1),
  USD: makeMultiplierProfile(0.68),
  GBP: makeMultiplierProfile(0.55),
  PKR: makeMultiplierProfile(150),
  INR: makeMultiplierProfile(55),
  AED: makeMultiplierProfile(2.45),
  SAR: makeMultiplierProfile(2.4),
  TRY: makeMultiplierProfile(20),
};

function makeMultiplierProfile(multiplier: number) {
  return {
    FRUIT_AND_VEGETABLES: multiplier,
    BAKERY_AND_GRAINS: multiplier,
    PANTRY_AND_COOKING: multiplier,
    DRINKS: multiplier,
    MEAT_DAIRY_AND_PROTEIN: multiplier,
    SNACKS_AND_SWEETS: multiplier,
    KITCHEN_AND_COOKWARE: multiplier,
    CLEANING_AND_PERSONAL_CARE: multiplier,
    CLOTHING: multiplier,
    HOME_AND_STORAGE: multiplier,
    ELECTRONICS: multiplier,
    SCHOOL_AND_MISC: multiplier,
  } satisfies Record<ProductCategory, number>;
}

function toMinorUnits(majorUnits: number) {
  return Math.max(1, Math.round(majorUnits * 100));
}

function fromMinorUnits(minorUnits: number) {
  return minorUnits / 100;
}

function roundMajorPrice(value: number, currencyCode: SupportedCurrencyCode) {
  const profile = profileMetadata[currencyCode];

  if (profile.fractionDigits === 0) {
    if (value >= 10000) return Math.round(value / 500) * 500;
    if (value >= 1000) return Math.round(value / 100) * 100;
    if (value >= 100) return Math.round(value / 10) * 10;
    return Math.max(1, Math.round(value));
  }

  if (value >= 1000) return Math.round(value);
  if (value >= 100) return Math.round(value) - 0.01;
  if (value >= 20) return Math.round(value) - 0.01;
  if (value >= 5) return Math.round(value * 10) / 10;
  return Math.max(0.49, Math.round(value * 20) / 20);
}

function clampMajorPrice(value: number, category: ProductCategory, currencyCode: SupportedCurrencyCode) {
  const [minimum, maximum] = categoryMajorPriceRanges[currencyCode][category];
  return clamp(value, minimum, maximum);
}

export function normalizeCurrencyCode(value: string | null | undefined): SupportedCurrencyCode {
  const normalized = String(value ?? "AUD").trim().toUpperCase();
  return SUPPORTED_CURRENCY_CODES.includes(normalized as SupportedCurrencyCode)
    ? (normalized as SupportedCurrencyCode)
    : "AUD";
}

export function getPriceProfileMetadata(currencyCode: string | null | undefined) {
  return profileMetadata[normalizeCurrencyCode(currencyCode)];
}

export function getSupportedPriceProfiles() {
  return SUPPORTED_CURRENCY_CODES.map((currencyCode) => profileMetadata[currencyCode]);
}

export function getRegionalCatalogPricing(input: CatalogPriceInput, currencyCodeInput: string): RegionalPricing {
  const currencyCode = normalizeCurrencyCode(currencyCodeInput);
  const profile = profileMetadata[currencyCode];
  const override = regionalOverrides[currencyCode][input.name];
  const fallbackMajor =
    fromMinorUnits(input.basePrice) * categoryFallbackMultiplier[currencyCode][input.category];
  const baseMajor = override ?? fallbackMajor;
  const roundedBaseMajor = roundMajorPrice(
    clampMajorPrice(baseMajor, input.category, currencyCode),
    currencyCode,
  );
  const basePrice = toMinorUnits(roundedBaseMajor);
  const supplierRatio = input.supplierRatio ?? profile.supplierRatio;
  const supplierPrice = toMinorUnits(
    roundMajorPrice(clampMajorPrice(roundedBaseMajor * supplierRatio, input.category, currencyCode), currencyCode),
  );

  return {
    currencyCode,
    unitLabel: unitOverrides[currencyCode]?.[input.unitLabel] ?? input.unitLabel,
    basePrice,
    supplierPrice: Math.min(supplierPrice, basePrice),
    marketAveragePrice: basePrice,
  };
}

export function buildCatalogPriceProfiles(
  input: CatalogPriceInput,
): RegionalPricing[] {
  return SUPPORTED_CURRENCY_CODES.map((currencyCode) => getRegionalCatalogPricing(input, currencyCode));
}

export async function getActiveCurrencyCode() {
  const worldState =
    (await prisma.worldState.findUnique({
      where: { id: "global" },
      select: { currencyCode: true },
    })) ??
    (await prisma.worldState.create({
      data: { id: "global" },
      select: { currencyCode: true },
    }));

  return normalizeCurrencyCode(worldState.currencyCode);
}

export async function applyWorldCurrencyProfile(currencyCodeInput: string) {
  const currencyCode = normalizeCurrencyCode(currencyCodeInput);
  const worldState =
    (await prisma.worldState.findUnique({ where: { id: "global" } })) ??
    (await prisma.worldState.create({ data: { id: "global" } }));
  const oldCurrencyCode = normalizeCurrencyCode(worldState.currencyCode);

  await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      select: {
        id: true,
        priceProfiles: true,
      },
    });

    for (const product of products) {
      const nextProfile = product.priceProfiles.find((profile) => profile.currencyCode === currencyCode);
      if (!nextProfile) continue;

      await tx.marketProductState.updateMany({
        where: { productId: product.id },
        data: {
          currentSupplierPrice: nextProfile.supplierPrice,
          marketAveragePrice: nextProfile.marketAveragePrice,
        },
      });
    }

    const listings = await tx.listing.findMany({
      select: {
        id: true,
        price: true,
        product: {
          select: {
            priceProfiles: true,
          },
        },
      },
    });

    for (const listing of listings) {
      const oldProfile = listing.product.priceProfiles.find((profile) => profile.currencyCode === oldCurrencyCode);
      const nextProfile = listing.product.priceProfiles.find((profile) => profile.currencyCode === currencyCode);
      if (!nextProfile) continue;

      const ratio = oldProfile
        ? clamp(listing.price / Math.max(oldProfile.marketAveragePrice, 1), 0.7, 1.9)
        : 1.12;
      const nextMajor = roundMajorPrice(fromMinorUnits(nextProfile.marketAveragePrice * ratio), currencyCode);

      await tx.listing.update({
        where: { id: listing.id },
        data: {
          price: toMinorUnits(nextMajor),
          currencyCode,
        },
      });
    }

    await tx.cartItem.deleteMany({
      where: {
        cart: {
          status: "ACTIVE",
        },
      },
    });

    await tx.cart.updateMany({
      where: { status: "ACTIVE" },
      data: { shopId: null },
    });

    await tx.worldState.update({
      where: { id: "global" },
      data: { currencyCode },
    });
  });

  return currencyCode;
}

export function getCatalogSourceItem(name: string) {
  for (const section of CATALOG_SOURCE) {
    const item = section.items.find((candidate) => candidate.name === name);
    if (item) {
      return {
        item,
        section,
      };
    }
  }

  return null;
}
