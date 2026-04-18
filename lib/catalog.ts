import { BotPersonality, ProductCategory } from "@prisma/client";

export type CatalogProduct = {
  sku: string;
  name: string;
  category: ProductCategory;
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

type ProductDraft = {
  name: string;
  basePrice: number;
  supplierPrice: number;
  category?: ProductCategory;
  description?: string;
  demandScore?: number;
  popularityScore?: number;
  trendLabel?: string;
  spoilable?: boolean;
  shelfLife?: number;
  keywords?: string[];
  sku?: string;
  imageUrl?: string;
};

type SectionDefaults = {
  category: ProductCategory;
  prefix: string;
  demandScore: number;
  popularityScore: number;
  trendLabel: string;
  spoilable: boolean;
  shelfLife?: number;
  keywords: string[];
  descriptionSuffix: string;
};

function slugifyName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createSection(defaults: SectionDefaults, items: ProductDraft[]): CatalogProduct[] {
  return items.map((item) => {
    const name = item.name;
    const keywords = Array.from(
      new Set(
        [
          ...defaults.keywords,
          ...name
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter(Boolean),
          item.name.toLowerCase(),
          ...(item.keywords ?? []),
        ].map((keyword) => keyword.toLowerCase()),
      ),
    );

    return {
      sku: item.sku ?? `${defaults.prefix}-${slugifyName(name)}`,
      name,
      category: item.category ?? defaults.category,
      description:
        item.description ??
        `${name} ${defaults.descriptionSuffix}`,
      basePrice: item.basePrice,
      supplierPrice: item.supplierPrice,
      demandScore: item.demandScore ?? defaults.demandScore,
      popularityScore: item.popularityScore ?? defaults.popularityScore,
      trendLabel: item.trendLabel ?? defaults.trendLabel,
      spoilable: item.spoilable ?? defaults.spoilable,
      shelfLife: item.shelfLife ?? defaults.shelfLife,
      keywords,
      imageUrl: item.imageUrl,
    };
  });
}

const fruits = createSection(
  {
    category: ProductCategory.FOOD,
    prefix: "food",
    demandScore: 1.12,
    popularityScore: 1.12,
    trendLabel: "Fresh demand",
    spoilable: true,
    shelfLife: 96,
    keywords: ["fruit", "fresh", "produce"],
    descriptionSuffix: "stocked as fresh fruit for everyday shoppers.",
  },
  [
    { name: "Apples", basePrice: 180, supplierPrice: 110, shelfLife: 120, trendLabel: "High demand", keywords: ["cheap apples"] },
    { name: "Bananas", basePrice: 150, supplierPrice: 90, shelfLife: 84 },
    { name: "Oranges", basePrice: 195, supplierPrice: 120, shelfLife: 120 },
    { name: "Mandarins", basePrice: 210, supplierPrice: 130, shelfLife: 120 },
    { name: "Lemons", basePrice: 160, supplierPrice: 95, shelfLife: 144 },
    { name: "Limes", basePrice: 170, supplierPrice: 100, shelfLife: 144 },
    { name: "Grapes", basePrice: 360, supplierPrice: 230, shelfLife: 72 },
    { name: "Strawberries", basePrice: 430, supplierPrice: 280, shelfLife: 72, trendLabel: "Trending" },
    { name: "Blueberries", basePrice: 480, supplierPrice: 320, shelfLife: 72, trendLabel: "Trending" },
    { name: "Raspberries", basePrice: 520, supplierPrice: 350, shelfLife: 60, trendLabel: "Trending" },
    { name: "Watermelon", basePrice: 780, supplierPrice: 520, shelfLife: 96 },
    { name: "Rockmelon", basePrice: 660, supplierPrice: 430, shelfLife: 96 },
    { name: "Pineapple", basePrice: 540, supplierPrice: 350, shelfLife: 120 },
    { name: "Mango", basePrice: 340, supplierPrice: 220, shelfLife: 84 },
    { name: "Kiwifruit", basePrice: 280, supplierPrice: 170, shelfLife: 108 },
    { name: "Peaches", basePrice: 310, supplierPrice: 190, shelfLife: 72 },
    { name: "Nectarines", basePrice: 320, supplierPrice: 200, shelfLife: 72 },
    { name: "Plums", basePrice: 260, supplierPrice: 160, shelfLife: 84 },
    { name: "Pears", basePrice: 230, supplierPrice: 145, shelfLife: 108 },
    { name: "Avocados", basePrice: 290, supplierPrice: 180, shelfLife: 72, keywords: ["guac", "guacamole"] },
  ],
);

const vegetables = createSection(
  {
    category: ProductCategory.FOOD,
    prefix: "food",
    demandScore: 1.05,
    popularityScore: 1.03,
    trendLabel: "Steady",
    spoilable: true,
    shelfLife: 120,
    keywords: ["vegetable", "veg", "fresh", "produce"],
    descriptionSuffix: "offered as fresh produce for cooking and home meals.",
  },
  [
    { name: "Potatoes", basePrice: 420, supplierPrice: 260, shelfLife: 240 },
    { name: "Sweet Potatoes", basePrice: 470, supplierPrice: 300, shelfLife: 216 },
    { name: "Carrots", basePrice: 220, supplierPrice: 130, shelfLife: 168 },
    { name: "Onions", basePrice: 210, supplierPrice: 120, shelfLife: 240 },
    { name: "Garlic", basePrice: 180, supplierPrice: 100, shelfLife: 240 },
    { name: "Ginger", basePrice: 240, supplierPrice: 150, shelfLife: 216 },
    { name: "Broccoli", basePrice: 260, supplierPrice: 160, shelfLife: 96 },
    { name: "Cauliflower", basePrice: 330, supplierPrice: 210, shelfLife: 96 },
    { name: "Cabbage", basePrice: 310, supplierPrice: 190, shelfLife: 168 },
    { name: "Lettuce", basePrice: 230, supplierPrice: 140, shelfLife: 72 },
    { name: "Spinach", basePrice: 270, supplierPrice: 170, shelfLife: 60 },
    { name: "Kale", basePrice: 290, supplierPrice: 180, shelfLife: 72 },
    { name: "Zucchini", basePrice: 240, supplierPrice: 150, shelfLife: 96 },
    { name: "Eggplant", basePrice: 290, supplierPrice: 180, shelfLife: 96 },
    { name: "Capsicum", basePrice: 260, supplierPrice: 160, shelfLife: 96, keywords: ["pepper", "bell pepper"] },
    { name: "Tomatoes", basePrice: 210, supplierPrice: 130, shelfLife: 84, trendLabel: "Fresh demand", keywords: ["fresh tomatoes"] },
    { name: "Cucumber", basePrice: 220, supplierPrice: 135, shelfLife: 72 },
    { name: "Pumpkin", basePrice: 450, supplierPrice: 290, shelfLife: 216 },
    { name: "Corn Cobs", basePrice: 260, supplierPrice: 160, shelfLife: 84 },
    { name: "Green Beans", basePrice: 280, supplierPrice: 170, shelfLife: 72 },
    { name: "Peas", basePrice: 250, supplierPrice: 150, shelfLife: 84 },
    { name: "Mushrooms", basePrice: 320, supplierPrice: 210, shelfLife: 60 },
  ],
);

const meatAndSeafood = createSection(
  {
    category: ProductCategory.FOOD,
    prefix: "food",
    demandScore: 1.09,
    popularityScore: 1.07,
    trendLabel: "Busy kitchens",
    spoilable: true,
    shelfLife: 72,
    keywords: ["meat", "protein", "seafood", "dinner"],
    descriptionSuffix: "stocked as a protein staple for regular grocery baskets.",
  },
  [
    { name: "Chicken Breast", basePrice: 760, supplierPrice: 520, shelfLife: 72 },
    { name: "Chicken Thighs", basePrice: 720, supplierPrice: 500, shelfLife: 72 },
    { name: "Whole Chicken", basePrice: 980, supplierPrice: 690, shelfLife: 72 },
    { name: "Beef Steak", basePrice: 1180, supplierPrice: 860, shelfLife: 72 },
    { name: "Beef Mince", basePrice: 820, supplierPrice: 570, shelfLife: 72 },
    { name: "Lamb Chops", basePrice: 1320, supplierPrice: 980, shelfLife: 72 },
    { name: "Lamb Leg", basePrice: 1890, supplierPrice: 1410, shelfLife: 72 },
    { name: "Pork Chops", basePrice: 920, supplierPrice: 650, shelfLife: 72 },
    { name: "Bacon Rashers", basePrice: 640, supplierPrice: 430, shelfLife: 96 },
    { name: "Sliced Ham", basePrice: 540, supplierPrice: 350, shelfLife: 96 },
    { name: "Sausages", basePrice: 680, supplierPrice: 460, shelfLife: 72 },
    { name: "Salami", basePrice: 710, supplierPrice: 470, shelfLife: 120 },
    { name: "Canned Tuna", basePrice: 290, supplierPrice: 180, spoilable: false, shelfLife: 720, trendLabel: "Pantry staple", keywords: ["tuna can", "pantry protein"] },
    { name: "Fresh Salmon", basePrice: 1290, supplierPrice: 930, shelfLife: 60 },
    { name: "Raw Prawns", basePrice: 1040, supplierPrice: 760, shelfLife: 48 },
    { name: "Fish Fillets", basePrice: 980, supplierPrice: 700, shelfLife: 60 },
  ],
);

const dairyAndEggs = createSection(
  {
    category: ProductCategory.FOOD,
    prefix: "food",
    demandScore: 1.08,
    popularityScore: 1.06,
    trendLabel: "Breakfast rush",
    spoilable: true,
    shelfLife: 120,
    keywords: ["dairy", "fridge", "breakfast", "eggs"],
    descriptionSuffix: "carried as a chilled grocery staple for home kitchens.",
  },
  [
    { name: "Full Cream Milk", category: ProductCategory.DRINKS, basePrice: 410, supplierPrice: 280, shelfLife: 96, keywords: ["milk"] },
    { name: "Skim Milk", category: ProductCategory.DRINKS, basePrice: 410, supplierPrice: 280, shelfLife: 96, keywords: ["milk"] },
    { name: "Chocolate Milk", category: ProductCategory.DRINKS, basePrice: 470, supplierPrice: 320, shelfLife: 96, keywords: ["milk drink"] },
    { name: "Cheddar Cheese", basePrice: 650, supplierPrice: 440, shelfLife: 168 },
    { name: "Mozzarella Cheese", basePrice: 680, supplierPrice: 460, shelfLife: 168 },
    { name: "Parmesan Cheese", basePrice: 740, supplierPrice: 520, shelfLife: 216 },
    { name: "Plain Yogurt", basePrice: 310, supplierPrice: 190, shelfLife: 144, keywords: ["yogurt"] },
    { name: "Greek Yogurt", basePrice: 360, supplierPrice: 230, shelfLife: 144, keywords: ["yogurt"] },
    { name: "Butter", basePrice: 490, supplierPrice: 320, shelfLife: 216 },
    { name: "Margarine", basePrice: 430, supplierPrice: 280, shelfLife: 240 },
    { name: "Thickened Cream", basePrice: 520, supplierPrice: 350, shelfLife: 96 },
    { name: "Eggs", basePrice: 620, supplierPrice: 470, shelfLife: 144, trendLabel: "High demand", keywords: ["egg carton"] },
  ],
);

const bakery = createSection(
  {
    category: ProductCategory.FOOD,
    prefix: "food",
    demandScore: 1.06,
    popularityScore: 1.05,
    trendLabel: "Fresh bake",
    spoilable: true,
    shelfLife: 72,
    keywords: ["bakery", "bread", "fresh"],
    descriptionSuffix: "supplied as a bakery item for daily shoppers.",
  },
  [
    { name: "White Bread Loaf", basePrice: 320, supplierPrice: 220, trendLabel: "Steady", keywords: ["bread loaf", "white bread"], sku: "food-bread" },
    { name: "Wholemeal Bread Loaf", basePrice: 340, supplierPrice: 230, keywords: ["bread loaf", "wholemeal bread"] },
    { name: "Multigrain Bread Loaf", basePrice: 360, supplierPrice: 250, keywords: ["bread loaf", "multigrain bread"] },
    { name: "Bread Rolls", basePrice: 380, supplierPrice: 260 },
    { name: "Burger Buns", basePrice: 390, supplierPrice: 260 },
    { name: "Tortilla Wraps", basePrice: 420, supplierPrice: 290, shelfLife: 120 },
    { name: "Croissants", basePrice: 450, supplierPrice: 300 },
    { name: "Chocolate Muffins", basePrice: 430, supplierPrice: 290 },
    { name: "Cupcakes", basePrice: 460, supplierPrice: 320 },
    { name: "Sponge Cake", basePrice: 620, supplierPrice: 430 },
    { name: "Meat Pies", basePrice: 520, supplierPrice: 350, shelfLife: 60 },
    { name: "Sausage Rolls", basePrice: 510, supplierPrice: 340, shelfLife: 60 },
  ],
);

const pantry = createSection(
  {
    category: ProductCategory.FOOD,
    prefix: "food",
    demandScore: 1.01,
    popularityScore: 1.02,
    trendLabel: "Pantry staple",
    spoilable: false,
    keywords: ["pantry", "staple", "grocery"],
    descriptionSuffix: "kept as a shelf-stable grocery staple.",
  },
  [
    { name: "White Rice", basePrice: 550, supplierPrice: 390, keywords: ["rice"] },
    { name: "Brown Rice", basePrice: 590, supplierPrice: 420, keywords: ["rice"] },
    { name: "Dry Pasta", basePrice: 470, supplierPrice: 300, keywords: ["pasta"] },
    { name: "Spaghetti", basePrice: 450, supplierPrice: 290, keywords: ["pasta"] },
    { name: "Instant Noodles", basePrice: 220, supplierPrice: 130, trendLabel: "Popular" },
    { name: "Plain Flour", basePrice: 330, supplierPrice: 210 },
    { name: "Self-Raising Flour", basePrice: 350, supplierPrice: 230 },
    { name: "White Sugar", basePrice: 300, supplierPrice: 190 },
    { name: "Brown Sugar", basePrice: 330, supplierPrice: 210 },
    { name: "Table Salt", basePrice: 180, supplierPrice: 100 },
    { name: "Black Pepper", basePrice: 250, supplierPrice: 150 },
    { name: "Rolled Oats", basePrice: 360, supplierPrice: 240 },
    { name: "Cornflakes Cereal", basePrice: 520, supplierPrice: 340, keywords: ["cereal"] },
    { name: "Muesli Cereal", basePrice: 560, supplierPrice: 370, keywords: ["cereal"] },
    { name: "Baked Beans Can", basePrice: 240, supplierPrice: 150 },
    { name: "Canned Tomatoes", basePrice: 210, supplierPrice: 130 },
    { name: "Canned Corn", basePrice: 200, supplierPrice: 120 },
    { name: "Instant Soup Packets", basePrice: 260, supplierPrice: 160 },
  ],
);

const snacks = createSection(
  {
    category: ProductCategory.FOOD,
    prefix: "food",
    demandScore: 1.1,
    popularityScore: 1.13,
    trendLabel: "Popular",
    spoilable: false,
    keywords: ["snacks", "treat", "quick buy"],
    descriptionSuffix: "stocked as a snack item for impulse shoppers.",
  },
  [
    { name: "Potato Chips Packet", basePrice: 280, supplierPrice: 170, keywords: ["chips"] },
    { name: "Corn Chips Packet", basePrice: 290, supplierPrice: 180, keywords: ["chips"] },
    { name: "Crackers Box", basePrice: 330, supplierPrice: 210 },
    { name: "Sweet Biscuits Packet", basePrice: 340, supplierPrice: 220 },
    { name: "Chocolate Bar", basePrice: 230, supplierPrice: 140 },
    { name: "Lollies Bag", basePrice: 290, supplierPrice: 180 },
    { name: "Muesli Bars Box", basePrice: 450, supplierPrice: 300 },
    { name: "Protein Bars Box", basePrice: 580, supplierPrice: 390 },
    { name: "Microwave Popcorn", basePrice: 350, supplierPrice: 220 },
    { name: "Mixed Nuts Pack", basePrice: 520, supplierPrice: 350 },
    { name: "Trail Mix Pack", basePrice: 490, supplierPrice: 330 },
  ],
);

const condiments = createSection(
  {
    category: ProductCategory.FOOD,
    prefix: "food",
    demandScore: 0.98,
    popularityScore: 1,
    trendLabel: "Steady",
    spoilable: false,
    keywords: ["condiments", "sauce", "pantry"],
    descriptionSuffix: "kept as a pantry condiment for cooking and serving.",
  },
  [
    { name: "Tomato Sauce Bottle", basePrice: 340, supplierPrice: 220 },
    { name: "Ketchup Bottle", basePrice: 350, supplierPrice: 230 },
    { name: "BBQ Sauce Bottle", basePrice: 390, supplierPrice: 260 },
    { name: "Mayonnaise Jar", basePrice: 410, supplierPrice: 280 },
    { name: "Mustard Bottle", basePrice: 330, supplierPrice: 210 },
    { name: "Soy Sauce Bottle", basePrice: 360, supplierPrice: 230 },
    { name: "Hot Sauce Bottle", basePrice: 380, supplierPrice: 240 },
    { name: "Salad Dressing Bottle", basePrice: 390, supplierPrice: 250 },
    { name: "Olive Oil Bottle", basePrice: 780, supplierPrice: 560, popularityScore: 1.04 },
    { name: "Vegetable Oil Bottle", basePrice: 550, supplierPrice: 380 },
    { name: "White Vinegar Bottle", basePrice: 290, supplierPrice: 180 },
    { name: "Honey Jar", basePrice: 620, supplierPrice: 430, popularityScore: 1.05 },
    { name: "Jam Jar", basePrice: 430, supplierPrice: 290 },
    { name: "Peanut Butter Jar", basePrice: 470, supplierPrice: 320, popularityScore: 1.06 },
  ],
);

const drinks = createSection(
  {
    category: ProductCategory.DRINKS,
    prefix: "drinks",
    demandScore: 1.12,
    popularityScore: 1.1,
    trendLabel: "Trending",
    spoilable: false,
    keywords: ["drink", "beverage", "refreshment"],
    descriptionSuffix: "offered as a drink item for everyday baskets.",
  },
  [
    { name: "Bottled Water", basePrice: 190, supplierPrice: 100, trendLabel: "High demand", keywords: ["water", "cheap drink"], sku: "drink-water" },
    { name: "Sparkling Water Bottle", basePrice: 240, supplierPrice: 140, keywords: ["sparkling water"] },
    { name: "Cola Soft Drink Bottle", basePrice: 260, supplierPrice: 150, keywords: ["cola", "soft drink"] },
    { name: "Lemonade Soft Drink Bottle", basePrice: 260, supplierPrice: 150, keywords: ["lemonade", "soft drink"] },
    { name: "Orange Juice Carton", basePrice: 360, supplierPrice: 230, spoilable: true, shelfLife: 168, keywords: ["juice"], sku: "drink-juice" },
    { name: "Apple Juice Carton", basePrice: 360, supplierPrice: 230, spoilable: true, shelfLife: 168, keywords: ["juice"] },
    { name: "Energy Drink Can", basePrice: 340, supplierPrice: 220, keywords: ["energy drink"] },
    { name: "Sports Drink Bottle", basePrice: 310, supplierPrice: 200, keywords: ["sports drink"] },
    { name: "Ground Coffee Bag", basePrice: 720, supplierPrice: 500, keywords: ["coffee"], trendLabel: "Morning boost" },
    { name: "Instant Coffee Jar", basePrice: 650, supplierPrice: 450, keywords: ["coffee"], trendLabel: "Morning boost" },
    { name: "Tea Bags Box", basePrice: 460, supplierPrice: 300, keywords: ["tea"] },
    { name: "Green Tea Box", basePrice: 490, supplierPrice: 320, keywords: ["tea"] },
    { name: "Hot Chocolate Powder Tin", basePrice: 540, supplierPrice: 360, keywords: ["hot chocolate"] },
  ],
);

const frozen = createSection(
  {
    category: ProductCategory.FOOD,
    prefix: "food",
    demandScore: 1.02,
    popularityScore: 1.02,
    trendLabel: "Cold aisle",
    spoilable: true,
    shelfLife: 720,
    keywords: ["frozen", "freezer"],
    descriptionSuffix: "kept in the frozen range for longer shelf life.",
  },
  [
    { name: "Frozen Vegetables Bag", basePrice: 420, supplierPrice: 280 },
    { name: "Frozen Fruit Bag", basePrice: 460, supplierPrice: 310 },
    { name: "Frozen Pizza", basePrice: 780, supplierPrice: 540 },
    { name: "Frozen Chips Bag", basePrice: 430, supplierPrice: 280 },
    { name: "Frozen Chicken Nuggets", basePrice: 620, supplierPrice: 420 },
    { name: "Ice Cream Tub", basePrice: 690, supplierPrice: 470, trendLabel: "Popular" },
    { name: "Ice Blocks Pack", basePrice: 470, supplierPrice: 320, trendLabel: "Popular" },
    { name: "Frozen Ready Meals", basePrice: 730, supplierPrice: 500 },
  ],
);

const deliReadyFood = createSection(
  {
    category: ProductCategory.FOOD,
    prefix: "food",
    demandScore: 1.08,
    popularityScore: 1.07,
    trendLabel: "Lunch rush",
    spoilable: true,
    shelfLife: 48,
    keywords: ["deli", "ready food", "quick lunch"],
    descriptionSuffix: "prepared for convenience-focused shoppers.",
  },
  [
    { name: "Roast Chicken", basePrice: 1120, supplierPrice: 790 },
    { name: "Pre-Made Sandwich", basePrice: 520, supplierPrice: 350 },
    { name: "Pre-Made Wrap", basePrice: 550, supplierPrice: 370 },
    { name: "Pre-Made Salad Bowl", basePrice: 620, supplierPrice: 430 },
    { name: "Sushi Rolls Pack", basePrice: 680, supplierPrice: 470 },
    { name: "Sliced Ham Pack", basePrice: 490, supplierPrice: 320 },
    { name: "Cheese Slices Pack", basePrice: 450, supplierPrice: 300 },
  ],
);

const baby = createSection(
  {
    category: ProductCategory.ESSENTIALS,
    prefix: "essentials",
    demandScore: 0.97,
    popularityScore: 0.98,
    trendLabel: "Steady",
    spoilable: false,
    keywords: ["baby", "parenting", "family"],
    descriptionSuffix: "supplied as a baby-care essential.",
  },
  [
    { name: "Baby Food Puree Pouch", basePrice: 260, supplierPrice: 160, spoilable: true, shelfLife: 240 },
    { name: "Infant Formula Tin", basePrice: 1890, supplierPrice: 1410 },
    { name: "Nappies Pack", basePrice: 1490, supplierPrice: 1090 },
    { name: "Baby Wipes Pack", basePrice: 520, supplierPrice: 350 },
  ],
);

const personalCare = createSection(
  {
    category: ProductCategory.ESSENTIALS,
    prefix: "essentials",
    demandScore: 1.03,
    popularityScore: 1.02,
    trendLabel: "Steady",
    spoilable: false,
    keywords: ["personal care", "bathroom", "hygiene"],
    descriptionSuffix: "stocked as a personal-care essential.",
  },
  [
    { name: "Shampoo Bottle", basePrice: 690, supplierPrice: 430, keywords: ["shampoo"], sku: "essentials-shampoo" },
    { name: "Conditioner Bottle", basePrice: 690, supplierPrice: 430 },
    { name: "Bar Soap", basePrice: 260, supplierPrice: 150, keywords: ["soap"], sku: "essentials-soap" },
    { name: "Hand Soap Pump", basePrice: 390, supplierPrice: 250, keywords: ["soap pump", "liquid soap"] },
    { name: "Body Wash Bottle", basePrice: 620, supplierPrice: 400 },
    { name: "Toothpaste Tube", basePrice: 360, supplierPrice: 220 },
    { name: "Toothbrush", basePrice: 340, supplierPrice: 190, keywords: ["toothbrushes"], sku: "essentials-toothbrushes" },
    { name: "Dental Floss", basePrice: 280, supplierPrice: 170 },
    { name: "Mouthwash Bottle", basePrice: 520, supplierPrice: 340 },
    { name: "Deodorant Stick", basePrice: 510, supplierPrice: 330 },
    { name: "Roll-On Deodorant", basePrice: 480, supplierPrice: 310 },
    { name: "Face Wash Tube", basePrice: 590, supplierPrice: 390 },
    { name: "Moisturiser Cream", basePrice: 650, supplierPrice: 430 },
    { name: "Lip Balm", basePrice: 240, supplierPrice: 140 },
    { name: "Razor", basePrice: 360, supplierPrice: 220 },
    { name: "Shaving Cream Can", basePrice: 420, supplierPrice: 260 },
    { name: "Hair Brush", basePrice: 390, supplierPrice: 240 },
    { name: "Comb", basePrice: 220, supplierPrice: 120 },
    { name: "Hair Ties Pack", basePrice: 280, supplierPrice: 170 },
  ],
);

const health = createSection(
  {
    category: ProductCategory.ESSENTIALS,
    prefix: "essentials",
    demandScore: 0.95,
    popularityScore: 0.97,
    trendLabel: "Steady",
    spoilable: false,
    keywords: ["health", "medical", "first aid"],
    descriptionSuffix: "carried as a health and wellness item.",
  },
  [
    { name: "Paracetamol Tablets", basePrice: 390, supplierPrice: 250 },
    { name: "Ibuprofen Tablets", basePrice: 410, supplierPrice: 270 },
    { name: "Vitamin Tablets", basePrice: 620, supplierPrice: 410 },
    { name: "Adhesive Bandages", basePrice: 260, supplierPrice: 160 },
    { name: "First Aid Kit", basePrice: 1280, supplierPrice: 940 },
  ],
);

const cleaning = createSection(
  {
    category: ProductCategory.ESSENTIALS,
    prefix: "essentials",
    demandScore: 1.01,
    popularityScore: 1.01,
    trendLabel: "Steady",
    spoilable: false,
    keywords: ["cleaning", "household cleaning"],
    descriptionSuffix: "kept as a cleaning staple for home care.",
  },
  [
    { name: "Laundry Detergent Liquid", basePrice: 980, supplierPrice: 650, keywords: ["laundry detergent"], sku: "essentials-detergent" },
    { name: "Fabric Softener Bottle", basePrice: 760, supplierPrice: 500 },
    { name: "Dishwashing Liquid Bottle", basePrice: 390, supplierPrice: 240 },
    { name: "Dishwasher Tablets Pack", basePrice: 920, supplierPrice: 620 },
    { name: "Surface Cleaner Spray", basePrice: 480, supplierPrice: 310 },
    { name: "Disinfectant Spray", basePrice: 520, supplierPrice: 340 },
    { name: "Glass Cleaner Spray", basePrice: 450, supplierPrice: 290 },
    { name: "Sponges Pack", basePrice: 260, supplierPrice: 160, keywords: ["cleaning sponges"] },
    { name: "Scrub Brush", basePrice: 320, supplierPrice: 200 },
    { name: "Broom", basePrice: 890, supplierPrice: 620 },
    { name: "Dustpan", basePrice: 340, supplierPrice: 210 },
    { name: "Mop", basePrice: 1040, supplierPrice: 730 },
    { name: "Bucket", basePrice: 470, supplierPrice: 310 },
  ],
);

const household = createSection(
  {
    category: ProductCategory.ESSENTIALS,
    prefix: "essentials",
    demandScore: 1.04,
    popularityScore: 1.03,
    trendLabel: "Useful pick",
    spoilable: false,
    keywords: ["household", "home care"],
    descriptionSuffix: "supplied as a household essential.",
  },
  [
    { name: "Wet Wipes Pack", basePrice: 360, supplierPrice: 230 },
    { name: "Toilet Paper Pack", basePrice: 890, supplierPrice: 590 },
    { name: "Paper Towel Rolls", basePrice: 640, supplierPrice: 420 },
    { name: "Tissues Box", basePrice: 300, supplierPrice: 180, keywords: ["tissues"], sku: "essentials-tissues" },
    { name: "Garbage Bags Roll", basePrice: 410, supplierPrice: 260 },
    { name: "Cling Wrap Roll", basePrice: 320, supplierPrice: 200 },
    { name: "Aluminium Foil Roll", basePrice: 360, supplierPrice: 230 },
    { name: "Baking Paper Roll", basePrice: 340, supplierPrice: 220 },
    { name: "Food Storage Containers", category: ProductCategory.KITCHEN, basePrice: 790, supplierPrice: 540, keywords: ["containers", "kitchen storage"] },
    { name: "Matches Box", basePrice: 190, supplierPrice: 100, keywords: ["matches"] },
  ],
);

const pet = createSection(
  {
    category: ProductCategory.ESSENTIALS,
    prefix: "essentials",
    demandScore: 0.99,
    popularityScore: 1.01,
    trendLabel: "Steady",
    spoilable: false,
    keywords: ["pet", "dog", "cat"],
    descriptionSuffix: "kept as a pet-care staple.",
  },
  [
    { name: "Dry Dog Food Bag", basePrice: 1490, supplierPrice: 1090 },
    { name: "Wet Dog Food Cans", basePrice: 520, supplierPrice: 340 },
    { name: "Dry Cat Food Bag", basePrice: 1390, supplierPrice: 1010 },
    { name: "Wet Cat Food Cans", basePrice: 490, supplierPrice: 320 },
    { name: "Cat Litter Bag", basePrice: 1240, supplierPrice: 890 },
  ],
);

const general = createSection(
  {
    category: ProductCategory.ESSENTIALS,
    prefix: "general",
    demandScore: 0.97,
    popularityScore: 0.98,
    trendLabel: "Mixed demand",
    spoilable: false,
    keywords: ["general store", "everyday"],
    descriptionSuffix: "available as a general small-good in Bazaarly.",
  },
  [
    { name: "Socks Pair", category: ProductCategory.CLOTHES, basePrice: 390, supplierPrice: 240, keywords: ["socks"], sku: "clothes-socks", popularityScore: 1.05, demandScore: 1.08, trendLabel: "Reliable seller" },
    { name: "Underwear Pack", category: ProductCategory.CLOTHES, basePrice: 460, supplierPrice: 280, keywords: ["underwear"], sku: "clothes-underwear", popularityScore: 1.06, demandScore: 1.09, trendLabel: "Reliable seller" },
    { name: "T-Shirt", category: ProductCategory.CLOTHES, basePrice: 890, supplierPrice: 610, keywords: ["shirt", "tee"], sku: "clothes-tshirts", popularityScore: 1.07, demandScore: 1.04, trendLabel: "Popular basics" },
    { name: "Kitchen Knife", category: ProductCategory.KITCHEN, basePrice: 980, supplierPrice: 690, keywords: ["knife"], sku: "kitchen-knives", trendLabel: "Selective demand" },
    { name: "Cutting Board", category: ProductCategory.KITCHEN, basePrice: 690, supplierPrice: 470, keywords: ["board"], sku: "kitchen-cutting-board", trendLabel: "Useful pick" },
    { name: "Frying Pan", category: ProductCategory.KITCHEN, basePrice: 1240, supplierPrice: 880, sku: "kitchen-frying-pan", trendLabel: "Useful pick" },
    { name: "Cooking Pot", category: ProductCategory.KITCHEN, basePrice: 1390, supplierPrice: 990, sku: "kitchen-cooking-pot", trendLabel: "Useful pick" },
    { name: "Blender Appliance", category: ProductCategory.KITCHEN, basePrice: 2490, supplierPrice: 1890, sku: "kitchen-blender-appliance", trendLabel: "Selective demand" },
    { name: "Toaster Appliance", category: ProductCategory.KITCHEN, basePrice: 1890, supplierPrice: 1410, sku: "kitchen-toaster-appliance", trendLabel: "Selective demand" },
    { name: "Batteries Pack", basePrice: 590, supplierPrice: 390, trendLabel: "Useful pick" },
    { name: "Light Bulbs Pack", basePrice: 720, supplierPrice: 490, trendLabel: "Useful pick" },
    { name: "Pen", basePrice: 180, supplierPrice: 90 },
    { name: "Notebook", basePrice: 290, supplierPrice: 160 },
    { name: "Toy Car", basePrice: 520, supplierPrice: 330, popularityScore: 1.01 },
    { name: "Doll", basePrice: 620, supplierPrice: 410, popularityScore: 1.01 },
    { name: "Lego Set", basePrice: 2490, supplierPrice: 1890, popularityScore: 1.03 },
    { name: "Jigsaw Puzzle", basePrice: 840, supplierPrice: 560, popularityScore: 1.02 },
  ],
);

const legacyUniqueProducts = createSection(
  {
    category: ProductCategory.ESSENTIALS,
    prefix: "legacy",
    demandScore: 0.95,
    popularityScore: 0.97,
    trendLabel: "Steady",
    spoilable: false,
    keywords: ["legacy", "existing"],
    descriptionSuffix: "kept in the catalog because it already exists in the live Bazaarly world.",
  },
  [
    { name: "Plates", category: ProductCategory.KITCHEN, basePrice: 740, supplierPrice: 510, sku: "kitchen-plates", keywords: ["dishes", "kitchen accessories"] },
    { name: "Cups", category: ProductCategory.KITCHEN, basePrice: 540, supplierPrice: 360, sku: "kitchen-cups", keywords: ["drinkware", "mugs"] },
    { name: "Spoons", category: ProductCategory.KITCHEN, basePrice: 430, supplierPrice: 290, sku: "kitchen-spoons", keywords: ["cutlery", "utensils"] },
    { name: "Bowls", category: ProductCategory.KITCHEN, basePrice: 610, supplierPrice: 410, sku: "kitchen-bowls", keywords: ["meal prep", "tableware"] },
    { name: "Spatulas", category: ProductCategory.KITCHEN, basePrice: 360, supplierPrice: 220, sku: "kitchen-spatulas", keywords: ["cooking", "utensils"] },
    { name: "Hats", category: ProductCategory.CLOTHES, basePrice: 760, supplierPrice: 500, sku: "clothes-hats", keywords: ["cap", "fashion"] },
    { name: "Hoodies", category: ProductCategory.CLOTHES, basePrice: 1490, supplierPrice: 1040, sku: "clothes-hoodies", keywords: ["hoodie", "outerwear"] },
    { name: "Shorts", category: ProductCategory.CLOTHES, basePrice: 840, supplierPrice: 560, sku: "clothes-shorts", keywords: ["summer", "casual"] },
  ],
);

export const PRODUCT_CATALOG: CatalogProduct[] = [
  ...fruits,
  ...vegetables,
  ...meatAndSeafood,
  ...dairyAndEggs,
  ...bakery,
  ...pantry,
  ...snacks,
  ...condiments,
  ...drinks,
  ...frozen,
  ...deliReadyFood,
  ...baby,
  ...personalCare,
  ...health,
  ...cleaning,
  ...household,
  ...pet,
  ...general,
  ...legacyUniqueProducts,
];

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
      description: "Fast-moving produce and breakfast staples with sharp prices.",
      categoryFocus: ProductCategory.FOOD,
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
      description: "Cold drinks, lunchbox staples, and convenient bundles.",
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
      description: "Kitchen basics and household small goods for practical shoppers.",
      categoryFocus: ProductCategory.KITCHEN,
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
      description: "Simple clothes and daily essentials with consistent stock.",
      categoryFocus: ProductCategory.CLOTHES,
      accentColor: "#D4A017",
      rating: 4.2,
      totalSales: 21,
      totalRevenue: 12890,
    },
  },
] as const;

export const INITIAL_BOTS = [
  {
    displayName: "Penny Saver",
    type: BotPersonality.BUDGET,
    budget: 1800,
    preferenceCategory: ProductCategory.FOOD,
    activityLevel: 75,
  },
  {
    displayName: "Quality Quinn",
    type: BotPersonality.QUALITY,
    budget: 3200,
    preferenceCategory: ProductCategory.DRINKS,
    activityLevel: 60,
  },
  {
    displayName: "Loyal Lee",
    type: BotPersonality.LOYAL,
    budget: 2600,
    preferenceCategory: ProductCategory.ESSENTIALS,
    activityLevel: 68,
  },
  {
    displayName: "Bulk Brooke",
    type: BotPersonality.BULK,
    budget: 4800,
    preferenceCategory: ProductCategory.FOOD,
    activityLevel: 52,
  },
  {
    displayName: "Random Riley",
    type: BotPersonality.RANDOM,
    budget: 2400,
    preferenceCategory: ProductCategory.KITCHEN,
    activityLevel: 58,
  },
] as const;
