import { BotPersonality, ProductCategory } from "@prisma/client";

import { CATALOG_SOURCE } from "@/lib/catalog-source";

export type CatalogProduct = {
  sku: string;
  name: string;
  category: ProductCategory;
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

export const CATEGORY_DEFINITIONS: Record<ProductCategory, CategoryDefinition> = {
  [ProductCategory.PRODUCE]: {
    label: "Produce",
    prefix: "produce",
    demandScore: 1.1,
    popularityScore: 1.08,
    trendLabel: "Fresh demand",
    spoilable: true,
    shelfLife: 96,
    supplierRatio: 0.66,
    keywords: ["produce", "fresh", "fruit", "vegetables"],
  },
  [ProductCategory.MEAT_AND_SEAFOOD]: {
    label: "Meat & Seafood",
    prefix: "meat",
    demandScore: 1.08,
    popularityScore: 1.05,
    trendLabel: "Dinner staple",
    spoilable: true,
    shelfLife: 72,
    supplierRatio: 0.72,
    keywords: ["meat", "seafood", "protein"],
  },
  [ProductCategory.DAIRY_AND_EGGS]: {
    label: "Dairy & Eggs",
    prefix: "dairy",
    demandScore: 1.07,
    popularityScore: 1.04,
    trendLabel: "Breakfast staple",
    spoilable: true,
    shelfLife: 120,
    supplierRatio: 0.7,
    keywords: ["dairy", "eggs", "chilled"],
  },
  [ProductCategory.BAKERY]: {
    label: "Bakery",
    prefix: "bakery",
    demandScore: 1.05,
    popularityScore: 1.04,
    trendLabel: "Fresh bake",
    spoilable: true,
    shelfLife: 72,
    supplierRatio: 0.67,
    keywords: ["bakery", "bread", "baked"],
  },
  [ProductCategory.PANTRY]: {
    label: "Pantry",
    prefix: "pantry",
    demandScore: 1.01,
    popularityScore: 1.01,
    trendLabel: "Pantry staple",
    spoilable: false,
    supplierRatio: 0.68,
    keywords: ["pantry", "grocery", "staple"],
  },
  [ProductCategory.SNACKS_AND_SWEETS]: {
    label: "Snacks & Sweets",
    prefix: "snacks",
    demandScore: 1.06,
    popularityScore: 1.08,
    trendLabel: "Popular",
    spoilable: false,
    supplierRatio: 0.69,
    keywords: ["snack", "sweet", "treat"],
  },
  [ProductCategory.DRINKS]: {
    label: "Drinks",
    prefix: "drinks",
    demandScore: 1.08,
    popularityScore: 1.07,
    trendLabel: "Trending",
    spoilable: false,
    supplierRatio: 0.68,
    keywords: ["drink", "beverage", "refreshment"],
  },
  [ProductCategory.CLOTHING_AND_FOOTWEAR]: {
    label: "Clothing & Footwear",
    prefix: "clothing",
    demandScore: 0.98,
    popularityScore: 1.02,
    trendLabel: "Steady",
    spoilable: false,
    supplierRatio: 0.6,
    keywords: ["clothing", "fashion", "footwear"],
  },
  [ProductCategory.SCHOOL_STATIONERY_AND_TOYS]: {
    label: "School, Stationery & Toys",
    prefix: "school",
    demandScore: 0.99,
    popularityScore: 1.01,
    trendLabel: "Useful pick",
    spoilable: false,
    supplierRatio: 0.59,
    keywords: ["school", "stationery", "toys"],
  },
  [ProductCategory.PERSONAL_CARE_AND_HEALTH]: {
    label: "Personal Care & Health",
    prefix: "care",
    demandScore: 1.02,
    popularityScore: 1.01,
    trendLabel: "Daily essential",
    spoilable: false,
    supplierRatio: 0.63,
    keywords: ["personal care", "health", "hygiene"],
  },
  [ProductCategory.CLEANING_AND_HOUSEHOLD]: {
    label: "Cleaning & Household",
    prefix: "household",
    demandScore: 1.01,
    popularityScore: 1,
    trendLabel: "Steady",
    spoilable: false,
    supplierRatio: 0.62,
    keywords: ["cleaning", "household", "home"],
  },
  [ProductCategory.KITCHEN_AND_DINING]: {
    label: "Kitchen & Dining",
    prefix: "kitchen",
    demandScore: 0.98,
    popularityScore: 1.01,
    trendLabel: "Useful pick",
    spoilable: false,
    supplierRatio: 0.61,
    keywords: ["kitchen", "dining", "cookware"],
  },
  [ProductCategory.BABY]: {
    label: "Baby",
    prefix: "baby",
    demandScore: 0.99,
    popularityScore: 1,
    trendLabel: "Family staple",
    spoilable: false,
    supplierRatio: 0.7,
    keywords: ["baby", "infant", "parenting"],
  },
  [ProductCategory.PET]: {
    label: "Pet",
    prefix: "pet",
    demandScore: 0.98,
    popularityScore: 1.01,
    trendLabel: "Steady",
    spoilable: false,
    supplierRatio: 0.65,
    keywords: ["pet", "dog", "cat"],
  },
  [ProductCategory.TECH_ELECTRONICS_AND_APPLIANCES]: {
    label: "Tech, Electronics & Appliances",
    prefix: "tech",
    demandScore: 0.96,
    popularityScore: 1.03,
    trendLabel: "Selective demand",
    spoilable: false,
    supplierRatio: 0.8,
    keywords: ["tech", "electronics", "appliance"],
  },
};

export const CATEGORY_OPTIONS = CATALOG_SOURCE.map((section) => {
  const value = ProductCategory[section.enumValue as keyof typeof ProductCategory];

  return {
    value,
    label: section.label,
  };
});

export const CATEGORY_COUNT_EXPECTATIONS = Object.fromEntries(
  CATALOG_SOURCE.map((section) => [section.enumValue, section.expectedCount]),
) as Record<ProductCategory, number>;

export const SUPPORTED_UNIT_LABELS = Array.from(
  new Set(
    CATALOG_SOURCE.flatMap((section) => section.items.map((item) => item.unitLabel)),
  ),
).sort((left, right) => left.localeCompare(right));

function slugifyName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCategoryLabel(category: ProductCategory | null | undefined) {
  if (!category) {
    return "All categories";
  }

  return CATEGORY_DEFINITIONS[category].label;
}

export function getCatalogProductBySku(sku: string) {
  return PRODUCT_CATALOG.find((product) => product.sku === sku) ?? null;
}

export function getCatalogProductByName(name: string) {
  return PRODUCT_CATALOG.find((product) => product.name === name) ?? null;
}

function clampPrice(value: number, minimum = 100) {
  return Math.max(minimum, Math.round(value));
}

function buildKeywords(name: string, category: ProductCategory, unitLabel: string) {
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
        ...CATEGORY_DEFINITIONS[category].keywords,
      ].map((value) => value.toLowerCase()),
    ),
  );
}

function estimateProducePrice(name: string, unitLabel: string) {
  if (unitLabel === "/kg") {
    if (/berry|cherries|lychee/.test(name)) return 1590;
    if (/grapes/.test(name)) return 1090;
    if (/avocado/.test(name)) return 1290;
    if (/mango|kiwifruit|plum|nectarine|peach/.test(name)) return 690;
    if (/apple|pear|orange|mandarin|banana/.test(name)) return 490;
    if (/capsicum|tomatoes|beans|snow peas|brussels sprouts/.test(name)) return 990;
    if (/mushrooms/.test(name)) return 1690;
    if (/potato|onion|pumpkin|carrots|sweet potatoes/.test(name)) return 390;
    if (/ginger|garlic|chilli/.test(name)) return 1290;
    return 590;
  }

  if (unitLabel === "per punnet") {
    if (/strawberries/.test(name)) return 450;
    if (/blueberries|raspberries|blackberries/.test(name)) return 550;
    if (/mushrooms/.test(name)) return 450;
    return 420;
  }

  if (unitLabel === "per 1kg bag") return 350;
  if (unitLabel === "per 500g bag") return 290;
  if (unitLabel === "per bunch") return /fresh herbs mix/.test(name) ? 450 : 280;
  if (unitLabel === "per bag") return /lettuce|spinach|kale|bean sprouts/.test(name) ? 350 : 320;
  if (unitLabel === "per pack") {
    if (/cut watermelon|cut rockmelon|sliced pineapple|sliced mango/.test(name)) return 550;
    if (/broccoli florets|cauliflower florets|cut pumpkin|sliced mushrooms/.test(name)) return 420;
    return 390;
  }

  if (unitLabel === "each") {
    if (/watermelon/.test(name)) return 790;
    if (/coconut|dragon fruit|pineapple|papaya/.test(name)) return 550;
    if (/rockmelon/.test(name)) return 420;
    if (/avocados/.test(name)) return 260;
    if (/broccoli|cauliflower|cabbage|lettuce|celery|leeks|bok choy/.test(name)) return 320;
    if (/corn cobs/.test(name)) return 120;
    if (/garlic|passionfruit/.test(name)) return 130;
    return 250;
  }

  return 490;
}

function estimateMeatPrice(name: string, unitLabel: string) {
  if (unitLabel === "/kg") {
    if (/wagyu|ribeye|scotch fillet|t-bone|porterhouse/.test(name)) return 3290;
    if (/sirloin|lamb chops loin|lamb chops forequarter/.test(name)) return 2590;
    if (/salmon|barramundi|flathead/.test(name)) return 2890;
    if (/beef mince|lean beef mince/.test(name)) return 1490;
    if (/premium beef mince/.test(name)) return 1790;
    if (/chicken/.test(name)) return /marinated/.test(name) ? 1490 : 1190;
    if (/pork belly/.test(name)) return 1890;
    if (/pork chops|pork mince/.test(name)) return 1590;
    if (/bacon/.test(name)) return 1890;
    if (/prawns/.test(name)) return 2690;
    if (/fish fillets|basa/.test(name)) return 1990;
    return 1890;
  }

  if (unitLabel === "per 100g") {
    if (/roast beef/.test(name)) return 480;
    if (/salami/.test(name)) return 350;
    return 320;
  }

  if (unitLabel === "per can") return 210;
  if (unitLabel === "per pack") {
    if (/fish fillets/.test(name)) return 890;
    if (/mussels/.test(name)) return 1090;
    if (/squid rings|seafood sticks/.test(name)) return 690;
    if (/beef burger patties/.test(name)) return 990;
    return 790;
  }

  if (unitLabel === "each") {
    if (/cooked whole chicken/.test(name)) return 1290;
    if (/chorizo/.test(name)) return 480;
    return 390;
  }

  return 990;
}

function estimateDairyPrice(name: string, unitLabel: string) {
  if (unitLabel === "/kg") {
    if (/parmesan/.test(name)) return 2290;
    if (/tasty cheese|cheddar block|mozzarella block/.test(name)) return 1290;
    return 1590;
  }

  if (unitLabel === "each") {
    if (/milk 1l/.test(name)) return 250;
    if (/milk 2l/.test(name)) return 430;
    if (/almond milk|soy milk|oat milk/.test(name)) return 350;
    if (/chocolate milk small/.test(name)) return 260;
    if (/chocolate milk large/.test(name)) return 420;
    if (/single serve yogurt/.test(name)) return 180;
    if (/butter/.test(name)) return 690;
    if (/thickened cream 300ml/.test(name)) return 300;
    if (/thickened cream 600ml/.test(name)) return 520;
    if (/eggs/.test(name)) return /organic/.test(name) ? 890 : /free-range/.test(name) ? 690 : 560;
    return 450;
  }

  if (unitLabel === "per pack") return /feta/.test(name) ? 520 : /parmesan grated/.test(name) ? 620 : 540;
  return 420;
}

function estimateBakeryPrice(name: string, unitLabel: string) {
  if (unitLabel === "per loaf") {
    if (/sourdough/.test(name)) return 690;
    if (/banana bread/.test(name)) return 650;
    return /multigrain|wholemeal/.test(name) ? 470 : 420;
  }
  if (unitLabel === "per pack") {
    if (/croissants|mini croissants/.test(name)) return 590;
    if (/muffins|cupcakes/.test(name)) return 590;
    if (/naan|pizza base|bagels/.test(name)) return 520;
    if (/sausage rolls mini/.test(name)) return 690;
    return 450;
  }
  if (unitLabel === "each") {
    if (/sponge cake/.test(name)) return /cream/.test(name) ? 790 : 590;
    if (/chunky beef pies/.test(name)) return 650;
    if (/meat pies|sausage rolls large/.test(name)) return 480;
    if (/garlic bread|turkish bread/.test(name)) return 390;
    return 360;
  }
  return 450;
}

function estimatePantryPrice(name: string, unitLabel: string) {
  if (unitLabel === "/kg") {
    if (/olive oil/.test(name)) return 1600;
    if (/sesame oil/.test(name)) return 1100;
    if (/honey/.test(name)) return 1200;
    if (/rice/.test(name)) return 450;
    if (/flour|sugar/.test(name)) return 270;
    if (/rolled oats/.test(name)) return 450;
    return 380;
  }
  if (unitLabel === "per 500g") return /coffee/.test(name) ? 1400 : 230;
  if (unitLabel === "per box") {
    if (/cereal/.test(name)) return 650;
    if (/coffee pods/.test(name)) return 1090;
    if (/lasagne sheets/.test(name)) return 320;
    return 420;
  }
  if (unitLabel === "per pack") {
    if (/instant soup/.test(name)) return 220;
    if (/stock cubes/.test(name)) return 280;
    if (/corn flour/.test(name)) return 240;
    return 350;
  }
  if (unitLabel === "per jar") {
    if (/honey/.test(name)) return /organic/.test(name) ? 1290 : 1090;
    if (/peanut butter/.test(name)) return 480;
    if (/jam/.test(name)) return 450;
    if (/mayonnaise|mustard dijon/.test(name)) return 420;
    return 380;
  }
  if (unitLabel === "per bottle") {
    if (/olive oil extra virgin/.test(name)) return 1800;
    if (/olive oil regular/.test(name)) return 1300;
    if (/sesame oil/.test(name)) return 890;
    if (/salad dressing/.test(name)) return 420;
    if (/bbq sauce|fish sauce|oyster sauce/.test(name)) return 420;
    return 320;
  }
  if (unitLabel === "each") {
    if (/cup noodles/.test(name)) return 230;
    if (/instant noodles/.test(name)) return 120;
    if (/beans|tomatoes|corn|chickpeas|lentils|coconut milk/.test(name)) return 180;
    if (/passata bottle/.test(name)) return 250;
    if (/tomato paste tube/.test(name)) return 180;
    return 220;
  }
  return 350;
}

function estimateSnackPrice(name: string, unitLabel: string) {
  if (unitLabel === "per bag") {
    if (/mixed nuts|trail mix/.test(name)) return 590;
    if (/beef jerky/.test(name)) return 690;
    if (/potato chips|corn chips|pretzels/.test(name)) return 320;
    if (/lollies/.test(name)) return 300;
    return 360;
  }
  if (unitLabel === "per box") {
    if (/protein bars/.test(name)) return /low sugar/.test(name) ? 1090 : 990;
    if (/muesli bars/.test(name)) return 520;
    if (/crackers/.test(name)) return 350;
    return 420;
  }
  if (unitLabel === "per pack") {
    if (/cookies|sweet biscuits/.test(name)) return 350;
    if (/fruit leather/.test(name)) return 450;
    if (/microwave popcorn/.test(name)) return 260;
    if (/ice cream sticks/.test(name)) return 750;
    return 420;
  }
  if (unitLabel === "each") {
    if (/chocolate bar/.test(name)) return 250;
    if (/ice cream tub|frozen yoghurt tub/.test(name)) return 650;
    return 320;
  }
  return 420;
}

function estimateDrinkPrice(name: string, unitLabel: string) {
  if (unitLabel === "per litre") {
    if (/orange juice|apple juice/.test(name)) return 420;
    if (/mango nectar/.test(name)) return 360;
    return 330;
  }
  if (unitLabel === "per 500g") return 1600;
  if (unitLabel === "per jar") return /instant coffee/.test(name) ? 890 : 750;
  if (unitLabel === "per box") return /tea/.test(name) ? 450 : /coffee pods/.test(name) ? 1390 : 590;
  if (unitLabel === "per tin") return /dark hot chocolate/.test(name) ? 720 : 620;
  if (unitLabel === "per bottle") return /sparkling water/.test(name) ? 220 : 320;
  if (unitLabel === "each") {
    if (/bottled water small/.test(name)) return 150;
    if (/bottled water large/.test(name)) return 230;
    if (/cola|lemonade/.test(name)) return 350;
    if (/energy drink/.test(name)) return 420;
    if (/sports drink/.test(name)) return 380;
    if (/iced tea bottle/.test(name)) return 340;
    return 320;
  }
  return 350;
}

function estimateClothingPrice(name: string, unitLabel: string) {
  if (unitLabel === "per pair") {
    if (/running shoes|training shoes/.test(name)) return 12900;
    if (/football boots/.test(name)) return 14900;
    if (/formal dress shoes|leather boots|work boots/.test(name)) return 16900;
    if (/casual sneakers|high top sneakers|low top sneakers/.test(name)) return 9900;
    if (/slippers/.test(name)) return 2500;
    if (/slides|flip flops/.test(name)) return 1900;
    if (/gloves/.test(name)) return 1900;
    return 2900;
  }
  if (unitLabel === "per pack") {
    if (/socks/.test(name)) return 1200;
    if (/boxer|briefs/.test(name)) return 1800;
    return 1500;
  }
  if (unitLabel === "each") {
    if (/t-shirt|singlet|tank/.test(name)) return /graphic|oversized|sports/.test(name) ? 3000 : 2200;
    if (/polo shirt|button up shirt|dress shirt|flannel|denim shirt/.test(name)) return 4500;
    if (/hoodie|crewneck|fleece sweatshirt|hi-vis hoodie/.test(name)) return 6500;
    if (/light jacket|denim jacket|bomber jacket|windbreaker/.test(name)) return 8900;
    if (/puffer jacket|rain jacket/.test(name)) return 11900;
    if (/leather jacket/.test(name)) return 19900;
    if (/blazer|suit jacket/.test(name)) return /formal/.test(name) ? 14900 : 9900;
    if (/jeans|chinos|cargo pants|track pants|joggers|sweatpants|dress pants|rain pants/.test(name)) return 6500;
    if (/shorts|swim shorts|work shorts/.test(name)) return 3900;
    if (/pyjama set/.test(name)) return 4900;
    if (/pyjama pants|sleep shorts|robe/.test(name)) return 3500;
    if (/beanie|cap|bucket hat|scarf/.test(name)) return 2200;
    if (/belt leather/.test(name)) return 3500;
    if (/belt casual|wallet|coin pouch/.test(name)) return 2500;
    if (/watch digital/.test(name)) return 6900;
    if (/watch analog/.test(name)) return 8900;
    if (/sunglasses sport/.test(name)) return 6900;
    if (/sunglasses/.test(name)) return 3900;
    return 2900;
  }
  return 3500;
}

function estimateSchoolPrice(name: string, unitLabel: string) {
  if (unitLabel === "per ream") return 900;
  if (unitLabel === "per pack") {
    if (/colour pencils|markers|highlighters|whiteboard markers|paint brushes/.test(name)) return 690;
    if (/crayons/.test(name)) return 450;
    if (/sticky notes|binder clips|paper clips/.test(name)) return 320;
    if (/paint set/.test(name)) return 990;
    if (/playing cards|tennis balls/.test(name)) return 450;
    return 420;
  }
  if (unitLabel === "each") {
    if (/notebook|workbook|sketchbook|display book|document wallet|clipboard/.test(name)) return 450;
    if (/printer paper ream/.test(name)) return 900;
    if (/photo paper/.test(name)) return 2900;
    if (/blue pen|black pen|gel pen|ballpoint pen|wooden pencil/.test(name)) return 300;
    if (/mechanical pencil/.test(name)) return 450;
    if (/eraser|sharpener|ruler|glue stick|clear tape/.test(name)) return 250;
    if (/liquid glue|scissors|stapler|staples refill/.test(name)) return 550;
    if (/whiteboard small/.test(name)) return 1500;
    if (/desk organiser/.test(name)) return 1200;
    if (/calculator basic/.test(name)) return 1600;
    if (/scientific calculator/.test(name)) return 3500;
    if (/backpack small/.test(name)) return 2900;
    if (/backpack large/.test(name)) return 4500;
    if (/pencil case/.test(name)) return 1200;
    if (/lunch box/.test(name)) return /insulated/.test(name) ? 2400 : 1500;
    if (/drink bottle plastic/.test(name)) return 1200;
    if (/drink bottle metal/.test(name)) return 2500;
    if (/toy car small|toy truck|action figure/.test(name)) return 1200;
    if (/doll basic/.test(name)) return 1900;
    if (/building blocks set/.test(name)) return 3500;
    if (/lego style set small/.test(name)) return 2900;
    if (/lego style set large/.test(name)) return 7900;
    if (/jigsaw puzzle small/.test(name)) return 1500;
    if (/jigsaw puzzle large/.test(name)) return 2500;
    if (/colouring book/.test(name)) return 450;
    if (/play dough pack/.test(name)) return 550;
    if (/board game basic/.test(name)) return 1900;
    if (/soccer ball|basketball/.test(name)) return 2500;
    if (/water blaster/.test(name)) return 1800;
    if (/remote control car/.test(name)) return 4500;
    if (/plush toy small/.test(name)) return 1200;
    if (/plush toy large/.test(name)) return 2500;
    return 600;
  }
  return 600;
}

function estimatePersonalCarePrice(name: string, unitLabel: string) {
  if (unitLabel === "per pack") {
    if (/razors disposable/.test(name)) return 690;
    if (/cotton buds|cotton pads|bandages/.test(name)) return 320;
    return 390;
  }
  if (unitLabel === "each") {
    if (/electric toothbrush/.test(name)) return 6900;
    if (/toothbrush/.test(name)) return 350;
    if (/toothpaste/.test(name)) return 450;
    if (/mouthwash/.test(name)) return 650;
    if (/shampoo|conditioner|body wash/.test(name)) return 690;
    if (/face wash/.test(name)) return 790;
    if (/moisturiser/.test(name)) return 950;
    if (/lip balm/.test(name)) return 350;
    if (/deodorant/.test(name)) return 590;
    if (/shaving cream|hand soap liquid|hand sanitiser/.test(name)) return 450;
    if (/sunscreen/.test(name)) return 790;
    if (/tissues box|wet wipes pack/.test(name)) return 320;
    if (/paracetamol|ibuprofen/.test(name)) return 450;
    if (/vitamin tablets/.test(name)) return 1200;
    if (/antiseptic cream/.test(name)) return 450;
    if (/first aid kit/.test(name)) return 2200;
    if (/thermometer digital/.test(name)) return 1490;
    if (/heat pack reusable/.test(name)) return 1800;
    if (/eye drops|cough syrup|dental floss/.test(name)) return 480;
    return 450;
  }
  return 450;
}

function estimateCleaningPrice(name: string, unitLabel: string) {
  if (unitLabel === "per pair") return /rubber gloves/.test(name) ? 490 : 690;
  if (unitLabel === "per pack") {
    if (/cloth|microfibre|sponges|clothes hangers/.test(name)) return 490;
    if (/plain candles/.test(name)) return 320;
    return 420;
  }
  if (unitLabel === "each") {
    if (/laundry detergent small/.test(name)) return 790;
    if (/laundry detergent large/.test(name)) return 1690;
    if (/dishwasher tablets/.test(name)) return 1590;
    if (/fabric softener/.test(name)) return 690;
    if (/dishwashing liquid/.test(name)) return /large/.test(name) ? 550 : 350;
    if (/surface cleaner|disinfectant|glass cleaner|mould cleaner|air freshener spray|toilet cleaner/.test(name)) return 450;
    if (/bleach bottle/.test(name)) return 300;
    if (/bin bags|food storage bags|zip lock/.test(name)) return 390;
    if (/cling wrap|aluminium foil|baking paper/.test(name)) return 320;
    if (/paper towel rolls/.test(name)) return 450;
    if (/toilet paper 2 ply/.test(name)) return 690;
    if (/toilet paper 3 ply/.test(name)) return 890;
    if (/air freshener gel/.test(name)) return 350;
    if (/scented candles/.test(name)) return 490;
    if (/matches box/.test(name)) return 180;
    if (/batteries/.test(name)) return 690;
    if (/light bulb/.test(name)) return 590;
    if (/extension cord short/.test(name)) return 1490;
    if (/extension cord long/.test(name)) return 2490;
    if (/power board basic/.test(name)) return 1900;
    if (/power board surge protected/.test(name)) return 2900;
    if (/door mat/.test(name)) return /large/.test(name) ? 2500 : 1500;
    if (/umbrella compact/.test(name)) return 1900;
    if (/umbrella full size/.test(name)) return 2500;
    if (/rain poncho/.test(name)) return 590;
    if (/laundry basket/.test(name)) return /large/.test(name) ? 2900 : 1900;
    if (/pegs pack/.test(name)) return 350;
    if (/ironing board/.test(name)) return 4900;
    if (/iron clothes/.test(name)) return 3900;
    if (/storage box small/.test(name)) return 990;
    if (/storage box medium/.test(name)) return 1490;
    if (/storage box large/.test(name)) return 2200;
    if (/drawer organiser|shelf organiser/.test(name)) return 1200;
    if (/shoe rack|coat hooks/.test(name)) return 2500;
    if (/mirror small/.test(name)) return 1900;
    if (/mirror medium/.test(name)) return 2900;
    if (/picture frame small/.test(name)) return 990;
    if (/picture frame large/.test(name)) return 1800;
    return 420;
  }
  return 450;
}

function estimateKitchenPrice(name: string, unitLabel: string) {
  if (unitLabel === "per set") return /cutlery set metal/.test(name) ? 3900 : 1200;
  if (unitLabel === "each") {
    if (/plate ceramic|bowl ceramic|mug ceramic|glass tumbler|wine glass/.test(name)) return 690;
    if (/plate plastic|bowl plastic/.test(name)) return 350;
    if (/chef knife/.test(name)) return 3900;
    if (/paring knife|bread knife/.test(name)) return 1900;
    if (/cutting board/.test(name)) return /large/.test(name) ? 2200 : 1200;
    if (/frying pan/.test(name)) return /large/.test(name) ? 5900 : 3900;
    if (/saucepan/.test(name)) return /large/.test(name) ? 5500 : 3500;
    if (/cooking pot/.test(name)) return /large/.test(name) ? 7900 : 4900;
    if (/baking tray|muffin tray/.test(name)) return 1800;
    if (/mixing bowl/.test(name)) return /large/.test(name) ? 1500 : 900;
    if (/measuring cups set|measuring spoons set/.test(name)) return 1200;
    if (/colander|grater|dish rack/.test(name)) return 1900;
    if (/peeler|can opener|bottle opener|tongs|spatula|wooden spoon|ladle|whisk/.test(name)) return 790;
    if (/food storage containers set/.test(name)) return 2900;
    if (/lunch bag insulated/.test(name)) return 2400;
    if (/travel mug|coffee cup reusable|thermos flask/.test(name)) return 2500;
    if (/water jug/.test(name)) return 1900;
    return 950;
  }
  return 1200;
}

function estimateBabyPrice(name: string, unitLabel: string) {
  if (unitLabel === "each") {
    if (/infant formula tin/.test(name)) return 2890;
    if (/baby food pouch/.test(name)) return 250;
    if (/baby cereal box/.test(name)) return 550;
    if (/baby bottle twin pack/.test(name)) return 1800;
    if (/baby bottle/.test(name)) return 900;
    if (/dummy pack|baby bib pack|baby socks pack/.test(name)) return 950;
    if (/teether/.test(name)) return 1200;
    if (/nappies small pack/.test(name)) return 1490;
    if (/nappies value pack/.test(name)) return 2990;
    if (/baby wipes small pack/.test(name)) return 350;
    if (/baby wipes bulk pack/.test(name)) return 790;
    if (/baby shampoo|baby wash|baby lotion/.test(name)) return 550;
    if (/baby blanket|baby towel hooded/.test(name)) return 2500;
    if (/baby onesie/.test(name)) return 1200;
    if (/baby bath tub/.test(name)) return 3900;
    if (/pram basic/.test(name)) return 14900;
    if (/car seat basic/.test(name)) return 19900;
    if (/high chair basic/.test(name)) return 8900;
    return 1200;
  }
  return 1200;
}

function estimatePetPrice(name: string, unitLabel: string) {
  if (unitLabel === "each") {
    if (/dry dog food small bag|dry cat food small bag/.test(name)) return 1890;
    if (/dry dog food large bag|dry cat food large bag/.test(name)) return 4990;
    if (/wet dog food can|wet cat food can/.test(name)) return 220;
    if (/dog treats/.test(name)) return 550;
    if (/dog leash|dog collar/.test(name)) return 1500;
    if (/dog harness/.test(name)) return 2900;
    if (/dog bowl large|dog bed small|cat scratching post/.test(name)) return 3900;
    if (/dog bowl small|cat bowl small|cat toy interactive/.test(name)) return 1800;
    if (/dog bed large/.test(name)) return 5900;
    if (/chew toy dog|tennis ball dog toy|cat toy small/.test(name)) return 950;
    if (/cat litter clumping bag/.test(name)) return 1890;
    if (/cat litter bag/.test(name)) return 1490;
    if (/fish food flakes/.test(name)) return 650;
    if (/bird seed bag/.test(name)) return 1200;
    return 1200;
  }
  return 1200;
}

function estimateTechPrice(name: string) {
  if (/phone charger cable|fast charging cable/.test(name)) return 2500;
  if (/wall charger adapter/.test(name)) return 3500;
  if (/wireless charger/.test(name)) return 5900;
  if (/power bank small/.test(name)) return 3900;
  if (/power bank large/.test(name)) return 7900;
  if (/earphones wired/.test(name)) return 1900;
  if (/earbuds wireless budget/.test(name)) return 6900;
  if (/earbuds wireless premium/.test(name)) return 24900;
  if (/headphones over ear/.test(name)) return 9900;
  if (/noise cancelling headphones/.test(name)) return 34900;
  if (/bluetooth speaker small/.test(name)) return 6900;
  if (/bluetooth speaker large/.test(name)) return 14900;
  if (/smartphone budget/.test(name)) return 24900;
  if (/smartphone mid range/.test(name)) return 69900;
  if (/smartphone flagship/.test(name)) return 149900;
  if (/foldable smartphone/.test(name)) return 249900;
  if (/tablet mini/.test(name)) return 49900;
  if (/tablet standard/.test(name)) return 69900;
  if (/tablet pro/.test(name)) return 159900;
  if (/smartwatch fitness/.test(name)) return 29900;
  if (/smartwatch premium/.test(name)) return 69900;
  if (/fitness tracker/.test(name)) return 14900;
  if (/laptop budget/.test(name)) return 69900;
  if (/laptop business/.test(name)) return 129900;
  if (/laptop ultrabook/.test(name)) return 179900;
  if (/gaming laptop/.test(name)) return 249900;
  if (/2 in 1 laptop/.test(name)) return 149900;
  if (/desktop office pc/.test(name)) return 99900;
  if (/desktop gaming pc/.test(name)) return 249900;
  if (/mini desktop pc/.test(name)) return 89900;
  if (/all in one pc/.test(name)) return 159900;
  if (/monitor 24 inch/.test(name) && !/gaming/.test(name)) return 17900;
  if (/gaming monitor 24 inch/.test(name)) return 24900;
  if (/gaming monitor 27 inch/.test(name)) return 39900;
  if (/ultrawide monitor/.test(name)) return 59900;
  if (/4k monitor/.test(name)) return 54900;
  if (/mechanical keyboard/.test(name)) return 9900;
  if (/wireless keyboard/.test(name)) return 6900;
  if (/gaming mouse wired/.test(name)) return 4900;
  if (/gaming mouse wireless/.test(name)) return 9900;
  if (/ergonomic mouse/.test(name)) return 5900;
  if (/webcam full hd/.test(name)) return 9900;
  if (/microphone usb/.test(name)) return 12900;
  if (/usb flash drive 32gb/.test(name)) return 1500;
  if (/usb flash drive 64gb/.test(name)) return 2500;
  if (/external ssd 500gb/.test(name)) return 9900;
  if (/external ssd 1tb/.test(name)) return 15900;
  if (/external hdd 2tb/.test(name)) return 10900;
  if (/wifi router basic/.test(name)) return 12900;
  if (/wifi router high speed/.test(name)) return 29900;
  if (/mesh wifi system/.test(name)) return 39900;
  if (/printer inkjet/.test(name)) return 7900;
  if (/printer laser/.test(name)) return 19900;
  if (/printer all in one/.test(name)) return 14900;
  if (/scanner flatbed/.test(name)) return 12900;
  if (/gaming headset/.test(name)) return 14900;
  if (/vr headset standalone/.test(name)) return 89900;
  if (/handheld gaming console/.test(name)) return 49900;
  if (/gaming console standard/.test(name)) return 79900;
  if (/gaming console digital/.test(name)) return 64900;
  if (/action camera/.test(name)) return 49900;
  if (/digital camera compact/.test(name)) return 69900;
  if (/mirrorless camera/.test(name)) return 149900;
  if (/camera tripod/.test(name)) return 8900;
  if (/smart tv 43 inch/.test(name)) return 49900;
  if (/smart tv 55 inch/.test(name)) return 79900;
  if (/smart tv 65 inch/.test(name)) return 119900;
  if (/oled tv premium/.test(name)) return 249900;
  if (/soundbar/.test(name)) return 29900;
  if (/smart home hub/.test(name)) return 14900;
  if (/smart light bulb/.test(name)) return 2500;
  if (/smart plug/.test(name)) return 2900;
  if (/security camera indoor/.test(name)) return 7900;
  if (/security camera outdoor/.test(name)) return 12900;
  if (/microwave basic/.test(name)) return 14900;
  if (/microwave grill/.test(name)) return 24900;
  if (/air fryer small/.test(name)) return 9900;
  if (/air fryer large/.test(name)) return 19900;
  if (/toaster 2 slice/.test(name)) return 4900;
  if (/toaster 4 slice/.test(name)) return 7900;
  if (/kettle electric/.test(name)) return 5900;
  if (/blender standard/.test(name)) return 6900;
  if (/blender high power/.test(name)) return 14900;
  if (/food processor/.test(name)) return 12900;
  if (/coffee machine pod/.test(name)) return 11900;
  if (/coffee machine espresso/.test(name)) return 39900;
  if (/vacuum cleaner standard/.test(name)) return 14900;
  if (/vacuum cleaner cordless/.test(name)) return 39900;
  if (/robot vacuum/.test(name)) return 79900;
  if (/washing machine top load/.test(name)) return 69900;
  if (/washing machine front load/.test(name)) return 89900;
  if (/dryer standard/.test(name)) return 69900;
  if (/dishwasher compact/.test(name)) return 69900;
  if (/dishwasher full size/.test(name)) return 99900;
  if (/fridge small/.test(name)) return 49900;
  if (/fridge medium/.test(name)) return 99900;
  if (/fridge large/.test(name)) return 159900;
  if (/freezer chest small/.test(name)) return 59900;
  if (/portable heater/.test(name)) return 7900;
  if (/tower fan/.test(name)) return 9900;
  if (/air purifier/.test(name)) return 24900;
  if (/portable air conditioner/.test(name)) return 59900;
  if (/office chair ergonomic/.test(name)) return 29900;
  if (/gaming chair/.test(name)) return 39900;
  if (/desk basic/.test(name)) return 19900;
  if (/standing desk electric/.test(name)) return 69900;
  if (/bed frame single/.test(name)) return 24900;
  if (/bed frame queen/.test(name)) return 49900;
  if (/mattress single/.test(name)) return 29900;
  if (/mattress queen/.test(name)) return 69900;
  if (/wardrobe basic/.test(name)) return 39900;
  if (/bookshelf/.test(name)) return 14900;
  if (/side table/.test(name)) return 9900;
  return 8900;
}

function estimateBasePriceCents(category: ProductCategory, name: string, unitLabel: string) {
  const normalizedName = name.toLowerCase();
  switch (category) {
    case ProductCategory.PRODUCE:
      return estimateProducePrice(normalizedName, unitLabel);
    case ProductCategory.MEAT_AND_SEAFOOD:
      return estimateMeatPrice(normalizedName, unitLabel);
    case ProductCategory.DAIRY_AND_EGGS:
      return estimateDairyPrice(normalizedName, unitLabel);
    case ProductCategory.BAKERY:
      return estimateBakeryPrice(normalizedName, unitLabel);
    case ProductCategory.PANTRY:
      return estimatePantryPrice(normalizedName, unitLabel);
    case ProductCategory.SNACKS_AND_SWEETS:
      return estimateSnackPrice(normalizedName, unitLabel);
    case ProductCategory.DRINKS:
      return estimateDrinkPrice(normalizedName, unitLabel);
    case ProductCategory.CLOTHING_AND_FOOTWEAR:
      return estimateClothingPrice(normalizedName, unitLabel);
    case ProductCategory.SCHOOL_STATIONERY_AND_TOYS:
      return estimateSchoolPrice(normalizedName, unitLabel);
    case ProductCategory.PERSONAL_CARE_AND_HEALTH:
      return estimatePersonalCarePrice(normalizedName, unitLabel);
    case ProductCategory.CLEANING_AND_HOUSEHOLD:
      return estimateCleaningPrice(normalizedName, unitLabel);
    case ProductCategory.KITCHEN_AND_DINING:
      return estimateKitchenPrice(normalizedName, unitLabel);
    case ProductCategory.BABY:
      return estimateBabyPrice(normalizedName, unitLabel);
    case ProductCategory.PET:
      return estimatePetPrice(normalizedName, unitLabel);
    case ProductCategory.TECH_ELECTRONICS_AND_APPLIANCES:
      return estimateTechPrice(normalizedName);
    default:
      return 500;
  }
}

function inferSpoilage(category: ProductCategory, name: string) {
  if (
    category === ProductCategory.PRODUCE ||
    category === ProductCategory.MEAT_AND_SEAFOOD ||
    category === ProductCategory.BAKERY
  ) {
    return true;
  }

  if (category === ProductCategory.DAIRY_AND_EGGS) {
    return true;
  }

  if (category === ProductCategory.DRINKS) {
    return /juice|milk/.test(name);
  }

  if (category === ProductCategory.SNACKS_AND_SWEETS) {
    return /ice cream|frozen yoghurt/.test(name);
  }

  return false;
}

function inferShelfLife(category: ProductCategory, name: string, spoilable: boolean) {
  if (!spoilable) {
    return undefined;
  }

  if (category === ProductCategory.PRODUCE) {
    if (/berries|leaf|spinach|kale|bean sprouts/.test(name)) return 72;
    if (/mushrooms|cut /.test(name)) return 84;
    return 120;
  }

  if (category === ProductCategory.MEAT_AND_SEAFOOD) {
    if (/canned tuna/.test(name)) return 720;
    if (/prawns|fish|salmon|mussels|squid/.test(name)) return 60;
    return 72;
  }

  if (category === ProductCategory.DAIRY_AND_EGGS) {
    if (/milk|cream/.test(name)) return 96;
    return 168;
  }

  if (category === ProductCategory.BAKERY) {
    return 72;
  }

  if (category === ProductCategory.DRINKS) {
    return 168;
  }

  if (category === ProductCategory.SNACKS_AND_SWEETS) {
    return 360;
  }

  return 120;
}

function inferDemandScore(category: ProductCategory, name: string) {
  const base = CATEGORY_DEFINITIONS[category].demandScore;

  if (/water|milk|bread|rice|eggs|toilet paper|laundry detergent|smartphone/.test(name)) {
    return Number((base + 0.08).toFixed(2));
  }

  if (/seasonal|premium|foldable|oled/.test(name)) {
    return Number((base - 0.04).toFixed(2));
  }

  return base;
}

function inferPopularityScore(category: ProductCategory, name: string) {
  const base = CATEGORY_DEFINITIONS[category].popularityScore;

  if (/apple|banana|bread|chips|cola|t-shirt|notebook|toothpaste|phone charger cable/.test(name)) {
    return Number((base + 0.08).toFixed(2));
  }

  return base;
}

function inferTrendLabel(category: ProductCategory, name: string) {
  if (/water|juice|cola|sports drink|energy drink/.test(name)) return "Trending";
  if (/berries|avocados|salmon|air fryer|smartphone|wireless/.test(name)) return "High demand";
  return CATEGORY_DEFINITIONS[category].trendLabel;
}

function describeProduct(category: ProductCategory, name: string, unitLabel: string) {
  return `${name} priced ${unitLabel} for the Bazaarly Australian market.`;
}

function buildCatalogProducts(): CatalogProduct[] {
  return CATALOG_SOURCE.flatMap((section) =>
    section.items.map((item) => {
      const category = ProductCategory[section.enumValue as keyof typeof ProductCategory];
      const definition = CATEGORY_DEFINITIONS[category];
      const basePrice = clampPrice(estimateBasePriceCents(category, item.name, item.unitLabel));
      const supplierPrice = clampPrice(basePrice * definition.supplierRatio, 60);
      const spoilable = inferSpoilage(category, item.name.toLowerCase()) || definition.spoilable;

      return {
        sku: `${definition.prefix}-${slugifyName(item.name)}`,
        name: item.name,
        category,
        unitLabel: item.unitLabel,
        description: describeProduct(category, item.name, item.unitLabel),
        basePrice,
        supplierPrice,
        demandScore: inferDemandScore(category, item.name.toLowerCase()),
        popularityScore: inferPopularityScore(category, item.name.toLowerCase()),
        trendLabel: inferTrendLabel(category, item.name.toLowerCase()),
        spoilable,
        shelfLife: inferShelfLife(category, item.name.toLowerCase(), spoilable) ?? definition.shelfLife,
        keywords: buildKeywords(item.name, category, item.unitLabel),
      };
    }),
  );
}

export const PRODUCT_CATALOG: CatalogProduct[] = buildCatalogProducts();

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
      description: "Fresh produce, bakery staples, and everyday grocery picks for fast-moving baskets.",
      categoryFocus: ProductCategory.PRODUCE,
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
      description: "Drinks, pantry staples, and snackable add-ons for quick everyday shopping.",
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
      description: "Kitchen, dining, and household essentials for practical Australian shoppers.",
      categoryFocus: ProductCategory.KITCHEN_AND_DINING,
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
      description: "Clothing, footwear, and personal care basics with dependable stock.",
      categoryFocus: ProductCategory.CLOTHING_AND_FOOTWEAR,
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
    preferenceCategory: ProductCategory.PANTRY,
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
    preferenceCategory: ProductCategory.PERSONAL_CARE_AND_HEALTH,
    activityLevel: 68,
  },
  {
    displayName: "Bulk Brooke",
    type: BotPersonality.BULK,
    budget: 4800,
    preferenceCategory: ProductCategory.PANTRY,
    activityLevel: 52,
  },
  {
    displayName: "Random Riley",
    type: BotPersonality.RANDOM,
    budget: 2400,
    preferenceCategory: ProductCategory.KITCHEN_AND_DINING,
    activityLevel: 58,
  },
] as const;
