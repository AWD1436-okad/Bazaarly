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
  iconSrc: string;
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
  iconSrc: string;
  category?: ProductCategory;
  subcategory?: string | null;
};

export const MUSLIM_CLOTHING_APPAREL = "Muslim Clothing & Apparel";

export const CATEGORY_DEFINITIONS: Record<ProductCategory, CategoryDefinition> = {
  [ProductCategory.FRUIT_AND_VEGETABLES]: {
    label: "Fruit & Vegetables",
    iconSrc: "/category-icons/fruit-vegetables.png",
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
    iconSrc: "/category-icons/bakery-grains.png",
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
    iconSrc: "/category-icons/pantry-cooking.png",
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
    iconSrc: "/category-icons/drinks.png",
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
    iconSrc: "/category-icons/meat-dairy-protein.png",
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
    iconSrc: "/category-icons/snacks-sweets.png",
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
    iconSrc: "/category-icons/kitchen-cookware.png",
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
    iconSrc: "/category-icons/cleaning-personal-care.png",
    prefix: "care",
    demandScore: 1.01,
    popularityScore: 1.01,
    trendLabel: "Daily basics",
    spoilable: false,
    supplierRatio: 0.73,
    keywords: ["cleaning", "personal care", "household"],
  },
  [ProductCategory.CLOTHING]: {
    label: "Clothing & Apparel",
    iconSrc: "/category-icons/clothing-apparel.png",
    prefix: "clothing",
    demandScore: 0.98,
    popularityScore: 1,
    trendLabel: "Wardrobe basics",
    spoilable: false,
    supplierRatio: 0.68,
    keywords: ["clothing", "fashion", "wear"],
  },
  [ProductCategory.MUSLIM_CLOTHING_AND_APPAREL]: {
    label: "Muslim Clothing & Apparel",
    iconSrc: "/category-icons/muslim-clothing-apparel.png",
    prefix: "muslimclothing",
    demandScore: 1,
    popularityScore: 1.02,
    trendLabel: "Modest style",
    spoilable: false,
    supplierRatio: 0.68,
    keywords: ["muslim clothing", "modest clothing", "apparel", "islamic clothing"],
  },
  [ProductCategory.HOME_AND_STORAGE]: {
    label: "Home & Storage",
    iconSrc: "/category-icons/home-storage.png",
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
    iconSrc: "/category-icons/electronics.png",
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
    iconSrc: "/category-icons/school-misc.png",
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
  ProductCategory.FRUIT_AND_VEGETABLES,
  ProductCategory.BAKERY_AND_GRAINS,
  ProductCategory.PANTRY_AND_COOKING,
  ProductCategory.DRINKS,
  ProductCategory.MEAT_DAIRY_AND_PROTEIN,
  ProductCategory.SNACKS_AND_SWEETS,
  ProductCategory.KITCHEN_AND_COOKWARE,
  ProductCategory.CLEANING_AND_PERSONAL_CARE,
  ProductCategory.CLOTHING,
  ProductCategory.MUSLIM_CLOTHING_AND_APPAREL,
  ProductCategory.HOME_AND_STORAGE,
  ProductCategory.ELECTRONICS,
  ProductCategory.SCHOOL_AND_MISC,
].map((category) => ({
  value: category,
  label: CATEGORY_DEFINITIONS[category].label,
  iconSrc: CATEGORY_DEFINITIONS[category].iconSrc,
}));

export function getCategoryFilterOption(value: string | null | undefined) {
  if (!value || value === "ALL") {
    return null;
  }

  return CATEGORY_OPTIONS.find((category) => category.value === value) ?? null;
}

export function getCategoryOptionDisplayLabel(category: CategoryOption) {
  return category.label;
}

export function getCategoryFilterLabel(value: string | null | undefined) {
  if (!value || value === "ALL") {
    return "All Products";
  }

  const option = getCategoryFilterOption(value);
  return option ? getCategoryOptionDisplayLabel(option) : "All Products";
}

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

const PRODUCT_DESCRIPTION_OVERRIDES: Record<string, string> = {
  Apples: "Fresh fruit for eating, cooking, or adding to snacks and lunch boxes.",
  Avocados: "Creamy fruit used for toast, salads, dips, and simple meals.",
  Bagels: "Round bread rolls suited for breakfast, sandwiches, or toasted snacks.",
  "Basic Thobe": "A simple long robe commonly worn by men for daily modest clothing.",
  Shampoo: "Hair washing product used to clean and refresh hair.",
  Notebook: "Paper notebook for school, study notes, planning, or writing.",
  Pans: "Kitchen pan used for frying eggs, meat, vegetables, and other foods.",
  "Frying Spatula": "Flat kitchen tool used for turning and lifting food while cooking.",
};

function describeClothingProduct(name: string) {
  if (/Thobe/.test(name)) {
    return "A long modest robe commonly worn by men for daily, formal, or Eid clothing.";
  }

  if (/Jubba/.test(name)) {
    return "A loose modest robe worn by men for comfortable everyday or occasion wear.";
  }

  if (/Kurta/.test(name)) {
    return "A long tunic-style top worn with modest outfits for casual or formal occasions.";
  }

  if (/Shalwar Kameez|Pakistani Eid Set/.test(name)) {
    return "Traditional matching outfit worn for modest daily wear, events, or Eid gatherings.";
  }

  if (/Waistcoat/.test(name)) {
    return "Dress vest worn over a kurta or formal outfit for a sharper look.";
  }

  if (/Sherwani/.test(name)) {
    return "Formal long coat worn for weddings, Eid, and special occasions.";
  }

  if (/Bisht/.test(name)) {
    return "Traditional outer cloak worn over formal clothing for special occasions.";
  }

  if (/Ihram/.test(name)) {
    return "Simple two-piece garment used by men during pilgrimage rituals.";
  }

  if (/Kufi|Taqiyah|Cap/.test(name)) {
    return "Small head covering worn with modest or traditional outfits.";
  }

  if (/Turban/.test(name)) {
    return "Head wrap worn as part of traditional or modest styling.";
  }

  if (/Islamic Sandals/.test(name)) {
    return "Open footwear suited for casual wear with modest traditional outfits.";
  }

  if (/Abaya/.test(name)) {
    return "Loose full-length outer garment worn by women for modest everyday wear.";
  }

  if (/Jilbab/.test(name)) {
    return "Loose modest garment designed to cover the body comfortably.";
  }

  if (/Khimar/.test(name)) {
    return "Modest head and shoulder covering worn over everyday clothing.";
  }

  if (/Hijab/.test(name)) {
    return "Headscarf worn for modest dressing and everyday styling.";
  }

  if (/Undercap/.test(name)) {
    return "Soft cap worn under a hijab to help keep it secure.";
  }

  if (/Niqab/.test(name)) {
    return "Face veil worn with modest clothing for additional coverage.";
  }

  if (/Modest Dress|Eid Dress/.test(name)) {
    return "Full-length dress designed for modest styling and special occasions.";
  }

  if (/Tunic/.test(name)) {
    return "Long modest top worn with skirts, trousers, or loose pants.";
  }

  if (/Loose Pants|Churidar/.test(name)) {
    return "Comfortable modest pants worn with tunics, kurtas, or long tops.";
  }

  if (/Skirt/.test(name)) {
    return "Long skirt designed for modest everyday outfits.";
  }

  if (/Prayer Dress/.test(name)) {
    return "Loose garment worn for prayer and comfortable modest coverage.";
  }

  if (/Swimwear/.test(name)) {
    return "Modest swim outfit designed for comfortable coverage in the water.";
  }

  if (/Dupatta/.test(name)) {
    return "Long scarf worn with traditional outfits for modest styling.";
  }

  if (/Shoes|Trainers|Sandals|Slippers/.test(name)) {
    return "Footwear for everyday outfits, walking, school, or casual wear.";
  }

  if (/Socks/.test(name)) {
    return "Soft socks worn with shoes for comfort and daily use.";
  }

  if (/Hats/.test(name)) {
    return "Headwear used for sun protection, warmth, or casual styling.";
  }

  return "Clothing item used for daily wear, modest outfits, or comfortable styling.";
}

function describeProduct(name: string, category: ProductCategory) {
  const override = PRODUCT_DESCRIPTION_OVERRIDES[name];
  if (override) return override;

  if (
    category === ProductCategory.CLOTHING ||
    category === ProductCategory.MUSLIM_CLOTHING_AND_APPAREL
  ) {
    return describeClothingProduct(name);
  }

  if (category === ProductCategory.FRUIT_AND_VEGETABLES) {
    if (/Parsley|Coriander|Mint/.test(name)) {
      return `${name} used to add fresh flavour to salads, meals, and home cooking.`;
    }
    if (/Lettuce|Spinach|Cucumbers|Tomatoes/.test(name)) {
      return `${name} used in fresh salads, wraps, sandwiches, and light side dishes.`;
    }
    if (/Potatoes|Sweet Potato|Onions|Garlic|Ginger/.test(name)) {
      return `${name} used as a base ingredient for curries, roasts, soups, and everyday cooking.`;
    }
    return `${name} used for fresh eating, cooking, salads, snacks, or family meals.`;
  }

  if (category === ProductCategory.BAKERY_AND_GRAINS) {
    return `${name} used for meals, lunch boxes, breakfast, baking, or everyday pantry staples.`;
  }

  if (category === ProductCategory.PANTRY_AND_COOKING) {
    return `${name} used for cooking, seasoning, sauces, baking, or pantry storage.`;
  }

  if (category === ProductCategory.DRINKS) {
    return `${name} used as a drink for refreshment, meals, school, work, or travel.`;
  }

  if (category === ProductCategory.MEAT_DAIRY_AND_PROTEIN) {
    if (/Lamb/.test(name)) {
      return `${name} used for curries, slow-cooked dishes, grills, and protein-rich family meals.`;
    }
    if (/Eggs/.test(name)) {
      return `${name} used for breakfast, baking, and quick protein meals at home.`;
    }
    if (/Cheese|Butter|Cream|Yogurt|Paneer/.test(name)) {
      return `${name} used for cooking, baking, sauces, and everyday dairy-based meals.`;
    }
    return `${name} used for cooking meals, adding protein, or preparing family dinners.`;
  }

  if (category === ProductCategory.SNACKS_AND_SWEETS) {
    return `${name} used as a snack, treat, lunch-box item, or quick dessert.`;
  }

  if (category === ProductCategory.KITCHEN_AND_COOKWARE) {
    return `${name} used for preparing, cooking, serving, or storing food at home.`;
  }

  if (category === ProductCategory.CLEANING_AND_PERSONAL_CARE) {
    return `${name} used for cleaning, hygiene, personal care, or household routines.`;
  }

  if (category === ProductCategory.HOME_AND_STORAGE) {
    return `${name} used for home organisation, comfort, storage, or everyday household needs.`;
  }

  if (category === ProductCategory.ELECTRONICS) {
    return `${name} used for communication, work, entertainment, charging, or digital tasks.`;
  }

  return `${name} used for school, writing, organising, carrying items, or everyday errands.`;
}

function buildCatalogProducts(): CatalogProduct[] {
  return CATALOG_SOURCE.flatMap((section) =>
    section.items.map((item) => {
      const category =
        item.subcategory === MUSLIM_CLOTHING_APPAREL
          ? ProductCategory.MUSLIM_CLOTHING_AND_APPAREL
          : section.enumValue;
      const subcategory =
        category === ProductCategory.MUSLIM_CLOTHING_AND_APPAREL
          ? MUSLIM_CLOTHING_APPAREL
          : item.subcategory;
      const definition = CATEGORY_DEFINITIONS[category];
      const supplierPrice = clampPrice(item.basePrice * definition.supplierRatio, 60);

      return {
        sku: `${definition.prefix}-${slugifyName(item.name)}`,
        name: item.name,
        category,
        subcategory,
        unitLabel: item.unitLabel,
        description: describeProduct(item.name, category),
        basePrice: item.basePrice,
        supplierPrice,
        demandScore: definition.demandScore,
        popularityScore: definition.popularityScore,
        trendLabel: inferTrendLabel(category, item.name),
        spoilable: definition.spoilable,
        shelfLife: inferShelfLife(category, item.unitLabel),
        keywords: buildKeywords(item.name, category, item.unitLabel, subcategory),
      };
    }),
  );
}

export const PRODUCT_CATALOG: CatalogProduct[] = buildCatalogProducts();

export const CATEGORY_COUNT_EXPECTATIONS = PRODUCT_CATALOG.reduce<Record<ProductCategory, number>>(
  (counts, product) => {
    counts[product.category] = (counts[product.category] ?? 0) + 1;
    return counts;
  },
  {} as Record<ProductCategory, number>,
);

export function getCategoryLabel(category: ProductCategory | null | undefined) {
  if (!category) {
    return "All categories";
  }

  return CATEGORY_DEFINITIONS[category].label;
}

export function getCategoryIconSrc(category: ProductCategory | null | undefined) {
  if (!category) {
    return null;
  }

  return CATEGORY_DEFINITIONS[category].iconSrc;
}

export function getProductCategoryLabel(
  category: ProductCategory | null | undefined,
  subcategory?: string | null,
) {
  const label = getCategoryLabel(category);
  if (subcategory === label) {
    return label;
  }

  if (category === ProductCategory.CLOTHING && subcategory) {
    return subcategory;
  }

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
    email: "avery@profitplanet.local",
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
    email: "jordan@profitplanet.local",
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
    email: "mia@profitplanet.local",
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
    email: "noah@profitplanet.local",
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
    displayName: "Budget Ben",
    type: BotPersonality.BUDGET,
    budget: 3200,
    preferenceCategory: ProductCategory.FRUIT_AND_VEGETABLES,
    activityLevel: 76,
  },
  {
    displayName: "Premium Aisha",
    type: BotPersonality.QUALITY,
    budget: 8500,
    preferenceCategory: ProductCategory.MEAT_DAIRY_AND_PROTEIN,
    activityLevel: 64,
  },
  {
    displayName: "Loyal Layla",
    type: BotPersonality.LOYAL,
    budget: 5200,
    preferenceCategory: ProductCategory.DRINKS,
    activityLevel: 66,
  },
  {
    displayName: "Bulk Bro",
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
