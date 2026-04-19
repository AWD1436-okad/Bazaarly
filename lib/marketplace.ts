import { Prisma, ProductCategory, ShopStatus, type MarketEvent } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 24;

export type MarketplaceParams = {
  q?: string;
  sort?: string;
  category?: string;
  stock?: string;
  minRating?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
};

const SHOP_LISTINGS_PAGE_SIZE = 12;

const listingCardSelect = {
  id: true,
  shopId: true,
  price: true,
  quantity: true,
  product: {
    select: {
      name: true,
      category: true,
      description: true,
      keywords: true,
    },
  },
  shop: {
    select: {
      name: true,
      rating: true,
    },
  },
} satisfies Prisma.ListingSelect;

type ListingWithRelations = {
  id: string;
  shopId: string;
  price: number;
  quantity: number;
  product: {
    name: string;
    category: ProductCategory;
    description: string;
    keywords: unknown;
  };
  shop: {
    name: string;
    rating: number;
  };
};

function tokenize(query: string) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

type SearchContext = {
  normalized: string;
  tokens: string[];
};

function buildSearchContext(query: string): SearchContext | null {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return {
    normalized,
    tokens: tokenize(query),
  };
}

function scoreListing(listing: ListingWithRelations, searchContext: SearchContext | null) {
  if (!searchContext) {
    return (
      listing.shop.rating * 20 +
      Math.min(listing.quantity, 20) +
      (listing.price <= 500 ? 12 : 0)
    );
  }

  const name = listing.product.name.toLowerCase();
  const shopName = listing.shop.name.toLowerCase();
  const description = listing.product.description.toLowerCase();
  const category = listing.product.category.toLowerCase();
  const keywords = Array.isArray(listing.product.keywords)
    ? listing.product.keywords.map((keyword: unknown) => String(keyword).toLowerCase())
    : [];

  let score = 0;

  if (name === searchContext.normalized) score += 160;
  if (name.includes(searchContext.normalized)) score += 110;
  if (shopName.includes(searchContext.normalized)) score += 70;
  if (category.includes(searchContext.normalized)) score += 60;
  if (description.includes(searchContext.normalized)) score += 40;

  for (const token of searchContext.tokens) {
    if (name.includes(token)) score += 28;
    if (shopName.includes(token)) score += 18;
    if (description.includes(token)) score += 12;
    if (category.includes(token)) score += 14;
    if (keywords.some((keyword: string) => keyword.includes(token))) score += 20;
  }

  score += Math.min(listing.quantity, 25);
  score += listing.shop.rating * 10;
  score += Math.max(0, 20 - listing.price / 100);

  return score;
}

async function getMarketplaceSupportData() {
  return Promise.all([
    prisma.marketEvent.findFirst({
      where: {
        active: true,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        startsAt: "desc",
      },
    }),
    prisma.marketProductState.findMany({
      select: {
        id: true,
        trendLabel: true,
        demandScore: true,
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      where: {
        product: {
          listings: {
            some: {
              active: true,
            },
          },
        },
      },
      orderBy: [{ demandScore: "desc" }, { popularityScore: "desc" }],
      take: 5,
    }),
    prisma.shop.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        rating: true,
      },
      orderBy: [{ totalRevenue: "desc" }, { rating: "desc" }],
      take: 5,
    }),
  ]);
}

export async function getMarketplaceData(params: MarketplaceParams) {
  const query = params.q?.trim() ?? "";
  const currentPage = Math.max(Number(params.page ?? "1") || 1, 1);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const minPrice = params.minPrice ? Number(params.minPrice) * 100 : null;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) * 100 : null;
  const minRating = params.minRating ? Number(params.minRating) : null;
  const inStockOnly = params.stock === "in";
  const normalizedQuery = query.toLowerCase();
  const searchContext = buildSearchContext(query);
  const categoryFilter =
    params.category && params.category !== "ALL" ? (params.category as ProductCategory) : null;

  const where: Prisma.ListingWhereInput = {
    active: true,
    shop: {
      status: ShopStatus.ACTIVE,
      ...(minRating ? { rating: { gte: minRating } } : {}),
    },
    ...(inStockOnly ? { quantity: { gt: 0 } } : {}),
    ...(minPrice !== null || maxPrice !== null
      ? {
          price: {
            ...(minPrice !== null ? { gte: minPrice } : {}),
            ...(maxPrice !== null ? { lte: maxPrice } : {}),
          },
        }
      : {}),
    ...(categoryFilter ? { product: { category: categoryFilter } } : {}),
  };

  if (query) {
    const categoryMatches = Object.values(ProductCategory)
      .filter((value) => value.toLowerCase().includes(normalizedQuery))
      .map((value) => ({ product: { category: value } as Prisma.ProductWhereInput }));

    where.OR = [
      { product: { name: { contains: query, mode: "insensitive" } } },
      { product: { description: { contains: query, mode: "insensitive" } } },
      { shop: { name: { contains: query, mode: "insensitive" } } },
      ...categoryMatches,
    ];
  }

  const sort = params.sort ?? "relevance";
  const usesRelevanceSearch = Boolean(query) && sort === "relevance";

  const browseOrderBy: Prisma.ListingOrderByWithRelationInput[] =
    sort === "price-asc"
      ? [{ price: "asc" as const }]
      : sort === "price-desc"
        ? [{ price: "desc" as const }]
        : sort === "rating"
          ? [{ shop: { rating: "desc" as const } }, { quantity: "desc" as const }]
          : sort === "stock"
            ? [{ quantity: "desc" as const }, { shop: { rating: "desc" as const } }]
            : [
                { shop: { rating: "desc" as const } },
                { quantity: "desc" as const },
                { price: "asc" as const },
                { updatedAt: "desc" as const },
              ];

  if (!query) {
    const browseListings: ListingWithRelations[] = await prisma.listing.findMany({
      where,
      select: listingCardSelect,
      orderBy: browseOrderBy,
      skip: pageStart,
      take: PAGE_SIZE + 1,
    });

    const [activeEvent, productStates, topShops] = await getMarketplaceSupportData();

    return {
      listings: browseListings.slice(0, PAGE_SIZE),
      currentPage,
      hasNextPage: browseListings.length > PAGE_SIZE,
      hasPreviousPage: currentPage > 1,
      pageSize: PAGE_SIZE,
      activeEvent,
      topShops,
      trendingProducts: productStates,
    };
  }

  if (!usesRelevanceSearch) {
    const sortedSearchListings: ListingWithRelations[] = await prisma.listing.findMany({
      where,
      select: listingCardSelect,
      orderBy: browseOrderBy,
      skip: pageStart,
      take: PAGE_SIZE + 1,
    });

    const [activeEvent, productStates, topShops] = await getMarketplaceSupportData();

    return {
      listings: sortedSearchListings.slice(0, PAGE_SIZE),
      currentPage,
      hasNextPage: sortedSearchListings.length > PAGE_SIZE,
      hasPreviousPage: currentPage > 1,
      pageSize: PAGE_SIZE,
      activeEvent,
      topShops,
      trendingProducts: productStates,
    };
  }

  const searchListings: ListingWithRelations[] = await prisma.listing.findMany({
    where,
    select: listingCardSelect,
    orderBy: browseOrderBy,
    take: pageStart + PAGE_SIZE + 1,
  });

  const filtered = searchListings
    .map((listing) => ({
      ...listing,
      relevanceScore: scoreListing(listing, searchContext),
    }))
    .filter((listing) => listing.relevanceScore > 0);

  filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const pageEnd = currentPage * PAGE_SIZE;

  const [activeEvent, productStates, topShops] = await getMarketplaceSupportData();

  return {
    listings: filtered.slice(pageStart, pageEnd),
    currentPage,
    hasNextPage: filtered.length > pageEnd,
    hasPreviousPage: currentPage > 1,
    pageSize: PAGE_SIZE,
    activeEvent,
    topShops,
    trendingProducts: productStates,
  };
}

export async function getShopPageData(shopId: string, page = 1) {
  const currentPage = Math.max(page, 1);
  const skip = (currentPage - 1) * SHOP_LISTINGS_PAGE_SIZE;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      name: true,
      description: true,
      categoryFocus: true,
      accentColor: true,
      rating: true,
      totalSales: true,
      totalRevenue: true,
      owner: {
        select: {
          displayName: true,
        },
      },
    },
  });

  if (!shop) {
    return null;
  }

  const listings = await prisma.listing.findMany({
    where: {
      shopId,
    },
    select: {
      id: true,
      price: true,
      quantity: true,
      active: true,
      product: {
        select: {
          name: true,
          category: true,
          description: true,
        },
      },
    },
    orderBy: [{ active: "desc" }, { quantity: "desc" }, { updatedAt: "desc" }],
    skip,
    take: SHOP_LISTINGS_PAGE_SIZE + 1,
  });

  return {
    ...shop,
    listings: listings.slice(0, SHOP_LISTINGS_PAGE_SIZE),
    currentPage,
    hasNextPage: listings.length > SHOP_LISTINGS_PAGE_SIZE,
    hasPreviousPage: currentPage > 1,
    pageSize: SHOP_LISTINGS_PAGE_SIZE,
  };
}

export async function getActiveEvent(): Promise<MarketEvent | null> {
  return prisma.marketEvent.findFirst({
    where: {
      active: true,
      startsAt: { lte: new Date() },
      endsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "desc" },
  });
}
