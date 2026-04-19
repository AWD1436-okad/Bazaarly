import { Prisma, ProductCategory, ShopStatus, type Listing, type MarketEvent, type Shop } from "@prisma/client";

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

type ListingWithRelations = Listing & {
  product: {
    id: string;
    name: string;
    category: ProductCategory;
    description: string;
    keywords: unknown;
  };
  shop: Shop & {
    owner: {
      displayName: string;
    };
  };
};

function tokenize(query: string) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function scoreListing(listing: ListingWithRelations, query: string) {
  if (!query) {
    return (
      listing.shop.rating * 20 +
      Math.min(listing.quantity, 20) +
      (listing.price <= 500 ? 12 : 0)
    );
  }

  const normalized = query.toLowerCase();
  const tokens = tokenize(query);
  const name = listing.product.name.toLowerCase();
  const shopName = listing.shop.name.toLowerCase();
  const description = listing.product.description.toLowerCase();
  const category = listing.product.category.toLowerCase();
  const keywords = Array.isArray(listing.product.keywords)
    ? listing.product.keywords.map((keyword) => String(keyword).toLowerCase())
    : [];

  let score = 0;

  if (name === normalized) score += 160;
  if (name.includes(normalized)) score += 110;
  if (shopName.includes(normalized)) score += 70;
  if (category.includes(normalized)) score += 60;
  if (description.includes(normalized)) score += 40;

  for (const token of tokens) {
    if (name.includes(token)) score += 28;
    if (shopName.includes(token)) score += 18;
    if (description.includes(token)) score += 12;
    if (category.includes(token)) score += 14;
    if (keywords.some((keyword) => keyword.includes(token))) score += 20;
  }

  score += Math.min(listing.quantity, 25);
  score += listing.shop.rating * 10;
  score += Math.max(0, 20 - listing.price / 100);

  return score;
}

export async function getMarketplaceData(params: MarketplaceParams) {
  const query = params.q?.trim() ?? "";
  const currentPage = Math.max(Number(params.page ?? "1") || 1, 1);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEnd = currentPage * PAGE_SIZE;
  const minPrice = params.minPrice ? Number(params.minPrice) * 100 : null;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) * 100 : null;
  const minRating = params.minRating ? Number(params.minRating) : null;
  const inStockOnly = params.stock === "in";
  const normalizedQuery = query.toLowerCase();
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

  const baseOrderBy: Prisma.ListingOrderByWithRelationInput[] =
    sort === "price-asc"
      ? [{ price: "asc" as const }]
      : sort === "price-desc"
        ? [{ price: "desc" as const }]
        : sort === "rating"
          ? [{ shop: { rating: "desc" as const } }, { quantity: "desc" as const }]
          : sort === "stock"
            ? [{ quantity: "desc" as const }, { shop: { rating: "desc" as const } }]
            : [{ updatedAt: "desc" as const }];

  const listings: ListingWithRelations[] = await prisma.listing.findMany({
    where,
    select: {
      id: true,
      shopId: true,
      productId: true,
      price: true,
      quantity: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          keywords: true,
        },
      },
      shop: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          description: true,
          categoryFocus: true,
          accentColor: true,
          rating: true,
          totalSales: true,
          totalRevenue: true,
          createdAt: true,
          updatedAt: true,
          status: true,
          slug: true,
          logoText: true,
          owner: {
            select: {
              displayName: true,
            },
          },
        },
      },
    },
    orderBy: baseOrderBy,
    take: pageEnd + 1,
  });

  const filtered = listings
    .map((listing) => ({
      ...listing,
      relevanceScore: scoreListing(listing, query),
    }))
    .filter((listing) => {
      if (!query) {
        return true;
      }

      return listing.relevanceScore > 0;
    });

  filtered.sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "rating":
        return b.shop.rating - a.shop.rating;
      case "stock":
        return b.quantity - a.quantity;
      default:
        return b.relevanceScore - a.relevanceScore;
    }
  });

  const [activeEvent, productStates, topShops] = await Promise.all([
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
