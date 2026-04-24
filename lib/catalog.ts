import { BotPersonality, ProductCategory } from "@prisma/client";

import { CATALOG_SOURCE } from "@/lib/catalog-source";

export type CatalogProduct = {
  sku: string;
  name: string;
  category: ProductCategory;
  subcategory?: string;
  unitLabel: string;
  description: string;
  basePrice: number;
  supplierPrice: number;
  demandScore: number;
  popularityScore: number;
  trendLabel: string;
  spoilable: boolean;
  shelfLife?: number;
  keywords: string[];
  imageUrl?: string;
};

type CategoryDefinition = {
  label: string;
  prefix: string;
  demandScore: number;
  popularityScore: number;
  trendLabel: string;
  spoilable: boolean;
  shelfLife?: number;
  supplierRatio: number;
  keywords: string[];
};

export type CategoryOption = {
  value: string;
  label: string;
  emoji: string;
  category?: ProductCategory;
  subcategory?: string;
};

export const MUSLIM_CLOTHING_MEN = "Men's Muslim Clothing";
export const MUSLIM_CLOTHING_WOMEN = "Women's Muslim Clothing";

export const CATEGORY_DEFINITIONS: Record<ProductCategory, CategoryDefinition> = {
  [ProductCategory.FRUIT_AND_VEGETABLES]: {
    label: "Fruit & Vegetables",
    prefix: "fruitveg",
    demandScore: 1.08,
    popularityScore: 1.07,
    trendLabel: "Fresh picks",
    spoilable: true,
    shelfLife: 96,
    supplierRatio: 0.72,
    keywords: ["fruit", "vegetables", "fresh"],
  },
  [ProductCategory.BAKERY_AND_GRAINS]: {
    label: "Bakery & Grains",
    prefix: "bakerygrains",
    demandScore: 1.04,
    popularityScore: 1.03,
    trendLabel: "Staple stock",
    spoilable: false,
    shelfLife: 240,
    supplierRatio: 0.74,
    keywords: ["bakery", "grains", "bread"],
  },
  [ProductCategory.PANTRY_AND_COOKING]: {
    label: "Pantry & Cooking",
    prefix: "pantrycook",
    demandScore: 1.02,
    popularityScore: 1.01,
    trendLabel: "Everyday pantry",
    spoilable: false,
    supplierRatio: 0.76,
    keywords: ["pantry", "cooking", "staples"],
  },
  [ProductCategory.DRINKS]: {
    label: "Drinks",
    prefix: "drinks",
    demandScore: 1.07,
    popularityScore: 1.06,
    trendLabel: "Trending sips",
    spoilable: false,
    shelfLife: 180,
    supplierRatio: 0.75,
    keywords: ["drinks", "beverages", "refreshment"],
  },
  [ProductCategory.MEAT_DAIRY_AND_PROTEIN]: {
    label: "Meat, Dairy & Protein",
    prefix: "protein",
    demandScore: 1.05,
    popularityScore: 1.04,
    trendLabel: "Dinner staples",
    spoilable: true,
    shelfLife: 120,
    supplierRatio: 0.78,
    keywords: ["meat", "dairy", "protein"],
  },
  [ProductCategory.SNACKS_AND_SWEETS]: {
    label: "Snacks & Sweets",
    prefix: "snacks",
    demandScore: 1.04,
    popularityScore: 1.06,
    trendLabel: "Impulse pick",
    spoilable: false,
    supplierRatio: 0.77,
    keywords: ["snacks", "sweets", "treats"],
  },
  [ProductCategory.KITCHEN_AND_COOKWARE]: {
    label: "Kitchen & Cookware",
    prefix: "kitchen",
    demandScore: 0.98,
    popularityScore: 1,
    trendLabel: "Home essentials",
    spoilable: false,
    supplierRatio: 0.71,
    keywords: ["kitchen", "cookware", "dining"],
  },
  [ProductCategory.CLEANING_AND_PERSONAL_CARE]: {
    label: "Cleaning & Personal Care",
    prefix: "care",
    demandScore: 1.01,
    popularityScore: 1.01,
    trendLabel: "Daily basics",
    spoilable: false,
    supplierRatio: 0.73,
    keywords: ["cleaning", "personal care", "household"],
  },
  [ProductCategory.CLOTHING]: {
    label: "Clothing",
    prefix: "clothing",
    demandScore: 0.98,
    popularityScore: 1,
    trendLabel: "Wardrobe basics",
    spoilable: false,
    supplierRatio: 0.68,
    keywords: ["clothing", "fashion", "wear"],
  },
  [ProductCategory.HOME_AND_STORAGE]: {
    label: "Home & Storage",
    prefix: "home",
    demandScore: 0.97,
    popularityScore: 0.99,
    trendLabel: "Home upkeep",
    spoilable: false,
    supplierRatio: 0.69,
    keywords: ["home", "storage", "household"],
  },
  [ProductCategory.ELECTRONICS]: {
    label: "Electronics",
    prefix: "electronics",
    demandScore: 0.94,
    popularityScore: 1.02,
    trendLabel: "High-ticket",
    spoilable: false,
    supplierRatio: 0.88,
    keywords: ["electronics", "devices", "tech"],
  },
  [ProductCategory.SCHOOL_AND_MISC]: {
    label: "School & Misc",
    prefix: "schoolmisc",
    demandScore: 0.99,
    popularityScore: 1,
    trendLabel: "Useful extras",
    spoilable: false,
    supplierRatio: 0.72,
    keywords: ["school", "misc", "stationery"],
  },
};

export const CATEGORY_OPTIONS: readonly CategoryOption[] = [
  {
    value: ProductCategory.FRUIT_AND_VEGETABLES,
    label: "Fruit & Vegetables",
    emoji: "🍎",
  },
  {
    value: ProductCategory.BAKERY_AND_GRAINS,
    label: "Bakery & Grains",
    emoji: "🍞",
  },
  {
    value: ProductCategory.PANTRY_AND_COOKING,
    label: "Pantry & Cooking",
    emoji: "🥫",
  },
  {
    value: ProductCategory.DRINKS,
    label: "Drinks",
    emoji: "🥤",
  },
  {
    value: ProductCategory.MEAT_DAIRY_AND_PROTEIN,
    label: "Meat, Dairy & Protein",
    emoji: "🥩",
  },
  {
    value: ProductCategory.SNACKS_AND_SWEETS,
    label: "Snacks & Sweets",
    emoji: "🍫",
  },
  {
    value: ProductCategory.KITCHEN_AND_COOKWARE,
    label: "Kitchen & Cookware",
    emoji: "🍳",
  },
  {
    value: ProductCategory.CLEANING_AND_PERSONAL_CARE,
    label: "Cleaning & Personal Care",
    emoji: "🧼",
  },
  {
    value: ProductCategory.CLOTHING,
    label: "Clothing",
    emoji: "👕",
  },
  {
    value: "CLOTHING_MUSLIM_MEN",
    label: "Men's Muslim Clothing",
    emoji: "👕",
    category: ProductCategory.CLOTHING,
    subcategory: MUSLIM_CLOTHING_MEN,
  },
  {
    value: "CLOTHING_MUSLIM_WOMEN",
    label: "Women's Muslim Clothing",
    emoji: "👕",
    category: ProductCategory.CLOTHING,
    subcategory: MUSLIM_CLOTHING_WOMEN,
  },
  {
    value: ProductCategory.HOME_AND_STORAGE,
    label: "Home & Storage",
    emoji: "🏠",
  },
  {
    value: ProductCategory.ELECTRONICS,
    label: "Electronics",
    emoji: "📱",
  },
  {
    value: ProductCategory.SCHOOL_AND_MISC,
    label: "School & Misc",
    emoji: "🎒",
  },
] as const;

export function getCategoryFilterOption(value: string | null | undefined) {
  if (!value || value === "ALL") {
    return null;
  }

  return CATEGORY_OPTIONS.find((category) => category.value === value) ?? null;
}

export function getCategoryFilterLabel(value: string | null | undefined) {
  if (!value || value === "ALL") {
    return "All Products";
  }

  return getCategoryFilterOption(value)?.label ?? "All Products";
}

export const CATEGORY_COUNT_EXPECTATIONS = Object.fromEntries(
  CATALOG_SOURCE.map((section) => [section.enumValue, section.items.length]),
) as Record<ProductCategory, number>;

export const SUPPORTED_UNIT_LABELS = Array.from(
  new Set(CATALOG_SOURCE.flatMap((section) => section.items.map((item) => item.unitLabel))),
).sort((left, right) => left.localeCompare(right));

function slugifyName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clampPrice(value: number, minimum = 100) {
  return Math.max(minimum, Math.round(value));
}

function buildKeywords(
  name: string,
  category: ProductCategory,
  unitLabel: string,
  subcategory?: string,
) {
  const tokens = name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  return Array.from(
    new Set(
      [
        ...tokens,
        name.toLowerCase(),
        unitLabel.toLowerCase(),
        subcategory?.toLowerCase(),
        ...CATEGORY_DEFINITIONS[category].keywords,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase()),
    ),
  );
}

function inferShelfLife(category: ProductCategory, unitLabel: string) {
  if (category === ProductCategory.FRUIT_AND_VEGETABLES) {
    return unitLabel === "per bunch" ? 72 : 120;
  }

  if (category === ProductCategory.MEAT_DAIRY_AND_PROTEIN) {
    if (unitLabel === "per tub") return 168;
    if (unitLabel === "per pack") return 120;
    return 96;
  }

  if (category === ProductCategory.DRINKS && /Milk/.test(unitLabel)) {
    return 120;
  }

  return CATEGORY_DEFINITIONS[category].shelfLife;
}

function inferTrendLabel(category: ProductCategory, name: string) {
  if (/Phone|Laptop|Tablet/.test(name)) return "Big ticket";
  if (/Energy Drink|Chocolate Milk|Sparkling Water/.test(name)) return "Trending sips";
  if (/Chips|Chocolate|Ice Cream/.test(name)) return "Popular snack";
  return CATEGORY_DEFINITIONS[category].trendLabel;
}

function describeProduct(name: string, unitLabel: string, subcategory?: string) {
  const subcategoryText = subcategory ? ` from ${subcategory}` : "";
  return `${name}${subcategoryText} priced ${unitLabel} in Bazaarly's curated marketplace catalog.`;
}

function buildCatalogProducts(): CatalogProduct[] {
  return CATALOG_SOURCE.flatMap((section) =>
    section.items.map((item) => {
      const definition = CATEGORY_DEFINITIONS[section.enumValue];
      const supplierPrice = clampPrice(item.basePrice * definition.supplierRatio, 60);

      return {
        sku: `${definition.prefix}-${slugifyName(item.name)}`,
        name: item.name,
        category: section.enumValue,
        subcategory: item.subcategory,
        unitLabel: item.unitLabel,
        description: describeProduct(item.name, item.unitLabel, item.subcategory),
        basePrice: item.basePrice,
        supplierPrice,
        demandScore: definition.demandScore,
        popularityScore: definition.popularityScore,
        trendLabel: inferTrendLabel(section.enumValue, item.name),
        spoilable: definition.spoilable,
        shelfLife: inferShelfLife(section.enumValue, item.unitLabel),
        keywords: buildKeywords(item.name, section.enumValue, item.unitLabel, item.subcategory),
      };
    }),
  );
}

export const PRODUCT_CATALOG: CatalogProduct[] = buildCatalogProducts();

export function getCategoryLabel(category: ProductCategory | null | undefined) {
  if (!category) {
    return "All categories";
  }

  return CATEGORY_DEFINITIONS[category].label;
}

export function getProductCategoryLabel(
  category: ProductCategory | null | undefined,
  subcategory?: string | null,
) {
  const label = getCategoryLabel(category);
  return subcategory ? `${label} / ${subcategory}` : label;
}

export function getCatalogProductBySku(sku: string) {
  return PRODUCT_CATALOG.find((product) => product.sku === sku) ?? null;
}

export function getCatalogProductByName(name: string) {
  return PRODUCT_CATALOG.find((product) => product.name === name) ?? null;
}

export function getDailyFeaturedProduct(referenceDate = new Date()) {
  const dayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(referenceDate);

  const index = Array.from(dayKey).reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) % PRODUCT_CATALOG.length,
    0,
  );

  return PRODUCT_CATALOG[index];
}

export const SHOP_THEMES = [
  { label: "Forest", value: "#2D6A4F" },
  { label: "Sunset", value: "#C96C50" },
  { label: "Ocean", value: "#1D4ED8" },
  { label: "Coral", value: "#E76F51" },
  { label: "Gold", value: "#D4A017" },
] as const;

export const INITIAL_USERS = [
  {
    username: "avery",
    email: "avery@bazaarly.local",
    displayName: "Avery",
    balance: 28400,
    shop: {
      name: "Fresh Basket Co",
      slug: "fresh-basket-co",
      description: "Fresh produce, grains, and everyday fridge staples for quick family baskets.",
      categoryFocus: ProductCategory.FRUIT_AND_VEGETABLES,
      accentColor: "#2D6A4F",
      rating: 4.6,
      totalSales: 34,
      totalRevenue: 18240,
    },
  },
  {
    username: "jordan",
    email: "jordan@bazaarly.local",
    displayName: "Jordan",
    balance: 25150,
    shop: {
      name: "Sip Street",
      slug: "sip-street",
      description: "Drinks, snacks, and fast pantry add-ons for everyday shoppers.",
      categoryFocus: ProductCategory.DRINKS,
      accentColor: "#1D4ED8",
      rating: 4.4,
      totalSales: 29,
      totalRevenue: 16070,
    },
  },
  {
    username: "mia",
    email: "mia@bazaarly.local",
    displayName: "Mia",
    balance: 23920,
    shop: {
      name: "Homeware Nook",
      slug: "homeware-nook",
      description: "Kitchen pieces, storage basics, and handy home add-ons for practical buyers.",
      categoryFocus: ProductCategory.KITCHEN_AND_COOKWARE,
      accentColor: "#C96C50",
      rating: 4.3,
      totalSales: 18,
      totalRevenue: 11440,
    },
  },
  {
    username: "noah",
    email: "noah@bazaarly.local",
    displayName: "Noah",
    balance: 26270,
    shop: {
      name: "Daily Thread",
      slug: "daily-thread",
      description: "Clothing, care basics, and school extras with dependable stock.",
      categoryFocus: ProductCategory.CLOTHING,
      accentColor: "#D4A017",
      rating: 4.2,
      totalSales: 21,
      totalRevenue: 12890,
    },
  },
] as const;

export const INITIAL_BOTS = [
  {
    displayName: "Budget Bro",
    type: BotPersonality.BUDGET,
    budget: 3200,
    preferenceCategory: ProductCategory.FRUIT_AND_VEGETABLES,
    activityLevel: 76,
  },
  {
    displayName: "Quality Queen",
    type: BotPersonality.QUALITY,
    budget: 8500,
    preferenceCategory: ProductCategory.MEAT_DAIRY_AND_PROTEIN,
    activityLevel: 64,
  },
  {
    displayName: "Loyal Lad",
    type: BotPersonality.LOYAL,
    budget: 5200,
    preferenceCategory: ProductCategory.DRINKS,
    activityLevel: 66,
  },
  {
    displayName: "Bulk Brook",
    type: BotPersonality.BULK,
    budget: 9800,
    preferenceCategory: ProductCategory.BAKERY_AND_GRAINS,
    activityLevel: 62,
  },
  {
    displayName: "Random Riley",
    type: BotPersonality.RANDOM,
    budget: 6100,
    preferenceCategory: ProductCategory.SCHOOL_AND_MISC,
    activityLevel: 58,
  },
  {
    displayName: "Style Sam",
    type: BotPersonality.QUALITY,
    budget: 14500,
    preferenceCategory: ProductCategory.CLOTHING,
    activityLevel: 68,
  },
  {
    displayName: "Eid Eva",
    type: BotPersonality.LOYAL,
    budget: 16500,
    preferenceCategory: ProductCategory.CLOTHING,
    activityLevel: 63,
  },
] as const;
