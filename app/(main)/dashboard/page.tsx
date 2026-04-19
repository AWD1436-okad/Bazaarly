import { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBanner } from "@/components/status-banner";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { prisma } from "@/lib/prisma";

const INVENTORY_PAGE_SIZE = 12;
const LISTING_PAGE_SIZE = 12;
const LISTING_OPTION_LIMIT = 40;

type DashboardProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type FreeInventoryRow = {
  inventoryId: string;
  productId: string;
  productName: string;
  availableToList: number;
  marketAveragePrice: number;
};

type BestSellerRow = {
  productId: string;
  productName: string;
  units: number;
  revenue: number;
};

function buildDashboardHref(
  params: Record<string, string | string[] | undefined>,
  updates: Record<string, number | null>,
) {
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      nextParams.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!value || value <= 1) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, String(value));
    }
  }

  const queryString = nextParams.toString();
  return queryString ? `/dashboard?${queryString}` : "/dashboard";
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const user = await requireUser();

  if (!user.shop) {
    redirect("/onboarding/shop");
  }

  const params = (await searchParams) ?? {};
  const welcome = params.welcome === "1";
  const supplierSuccess = params.supplierSuccess === "1";
  const listingSuccess = params.listingSuccess === "1";
  const error = typeof params.error === "string" ? params.error : null;
  const inventoryPage = Math.max(Number(params.inventoryPage ?? "1") || 1, 1);
  const listingsPage = Math.max(Number(params.listingsPage ?? "1") || 1, 1);
  const inventoryOffset = (inventoryPage - 1) * INVENTORY_PAGE_SIZE;
  const listingsOffset = (listingsPage - 1) * LISTING_PAGE_SIZE;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const freeInventoryBaseQuery = Prisma.sql`
    FROM "Inventory" i
    INNER JOIN "Product" p ON p."id" = i."productId"
    LEFT JOIN "MarketProductState" ms ON ms."productId" = p."id"
    WHERE i."userId" = ${user.id}
      AND i."quantity" > i."allocatedQuantity"
  `;

  const [
    listingOptions,
    freeInventoryRows,
    freeInventoryCountRows,
    listings,
    recentSales,
    lowStockListings,
    unreadAlerts,
    bestSellerRows,
    inventoryPresence,
    todayRevenueSummary,
  ] =
    await Promise.all([
      prisma.$queryRaw<FreeInventoryRow[]>(Prisma.sql`
        SELECT
          i."id" AS "inventoryId",
          i."productId" AS "productId",
          p."name" AS "productName",
          (i."quantity" - i."allocatedQuantity")::int AS "availableToList",
          COALESCE(ms."marketAveragePrice", p."basePrice")::int AS "marketAveragePrice"
        ${freeInventoryBaseQuery}
        ORDER BY p."name" ASC
        LIMIT ${LISTING_OPTION_LIMIT}
      `),
      prisma.$queryRaw<FreeInventoryRow[]>(Prisma.sql`
        SELECT
          i."id" AS "inventoryId",
          i."productId" AS "productId",
          p."name" AS "productName",
          (i."quantity" - i."allocatedQuantity")::int AS "availableToList",
          COALESCE(ms."marketAveragePrice", p."basePrice")::int AS "marketAveragePrice"
        ${freeInventoryBaseQuery}
        ORDER BY p."name" ASC
        OFFSET ${inventoryOffset}
        LIMIT ${INVENTORY_PAGE_SIZE + 1}
      `),
      prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS "count"
        ${freeInventoryBaseQuery}
      `),
      prisma.listing.findMany({
        where: {
          shopId: user.shop.id,
          OR: [{ active: true }, { quantity: { lte: 0 } }],
        },
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
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: listingsOffset,
        take: LISTING_PAGE_SIZE + 1,
      }),
      prisma.order.findMany({
        where: { sellerId: user.id },
        select: {
          id: true,
          totalPrice: true,
          createdAt: true,
          buyer: {
            select: {
              displayName: true,
            },
          },
          lineItems: {
            select: {
              id: true,
              quantity: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.listing.findMany({
        where: {
          shopId: user.shop.id,
          quantity: { lte: 5 },
          active: true,
        },
        select: {
          id: true,
          quantity: true,
          product: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { quantity: "asc" },
        take: 5,
      }),
      prisma.notification.findMany({
        where: {
          userId: user.id,
          read: false,
          type: { in: ["LOW_STOCK", "SALE"] },
        },
        select: {
          id: true,
          type: true,
          message: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.$queryRaw<BestSellerRow[]>(Prisma.sql`
        SELECT
          oli."productId" AS "productId",
          p."name" AS "productName",
          COALESCE(SUM(oli."quantity"), 0)::int AS "units",
          COALESCE(SUM(oli."lineTotal"), 0)::int AS "revenue"
        FROM "OrderLineItem" oli
        INNER JOIN "Order" o ON o."id" = oli."orderId"
        INNER JOIN "Product" p ON p."id" = oli."productId"
        WHERE o."sellerId" = ${user.id}
        GROUP BY oli."productId", p."name"
        ORDER BY SUM(oli."quantity") DESC, SUM(oli."lineTotal") DESC
        LIMIT 4
      `),
      prisma.inventory.findFirst({
        where: {
          userId: user.id,
          quantity: { gt: 0 },
        },
        select: {
          id: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          sellerId: user.id,
          createdAt: {
            gte: startOfToday,
            lt: endOfToday,
          },
        },
        _sum: {
          totalPrice: true,
        },
      }),
    ]);

  const visibleInventory = freeInventoryRows.slice(0, INVENTORY_PAGE_SIZE);
  const hasNextInventoryPage = freeInventoryRows.length > INVENTORY_PAGE_SIZE;
  const freeInventoryCount = Number(freeInventoryCountRows[0]?.count ?? 0);
  const visibleListings = listings.slice(0, LISTING_PAGE_SIZE);
  const hasNextListingsPage = listings.length > LISTING_PAGE_SIZE;
  const defaultListingPrice =
    listingOptions.length > 0 ? (listingOptions[0].marketAveragePrice / 100).toFixed(2) : "2.50";
  const todayRevenue = todayRevenueSummary._sum.totalPrice ?? 0;

  const hasListings = visibleListings.some((listing) => listing.quantity > 0);
  const hasInventory = Boolean(inventoryPresence);
  const bestSellers = bestSellerRows.map((item) => ({
    name: item.productName,
    units: item.units,
    revenue: item.revenue,
  }));

  return (
    <div className="page-grid">
      {welcome ? (
        <StatusBanner
          tone="success"
          title="Your shop is ready."
          body="Step 1: Buy your first stock from the supplier so you can create live listings."
          action={
            <Link href="/dashboard/supplier" className="ghost-button">
              Go to Supplier
            </Link>
          }
        />
      ) : null}

      {supplierSuccess && !hasListings ? (
        <StatusBanner
          tone="info"
          title="Stock purchased successfully."
          body="Step 2: Turn your inventory into live marketplace listings so shoppers can find you."
        />
      ) : null}

      {listingSuccess ? (
        <StatusBanner
          tone="success"
          title="Your shop is now live."
          body="Customers can now discover and buy your items in the marketplace."
        />
      ) : null}

      {error ? <StatusBanner tone="error" title="Action needs attention" body={error} /> : null}

      {!hasInventory ? (
        <StatusBanner
          tone="warning"
          title="Buy your first stock from the supplier"
          body="Your shop is set up, but you need inventory before you can list anything for sale."
          action={
            <Link href="/dashboard/supplier" className="ghost-button">
              Go to Supplier
            </Link>
          }
        />
      ) : null}

      <section className="page-header">
        <h1>{user.shop.name}</h1>
        <p>
          Manage inventory, publish listings, and monitor sales from the same seller dashboard.
        </p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <span className="metric-card__eyebrow">Balance</span>
          <strong>{formatCurrency(user.balance)}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-card__eyebrow">Today&apos;s revenue</span>
          <strong>{formatCurrency(todayRevenue)}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-card__eyebrow">Total revenue</span>
          <strong>{formatCurrency(user.shop.totalRevenue)}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="stack">
          <section className="card">
            <div className="section-row">
              <div>
                <h2>Create or update a listing</h2>
                <p>
                  Pick an inventory item you own and publish it live. Bazaarly will move
                  all free units for that product into your active listing automatically.
                </p>
              </div>
              <Link href="/dashboard/supplier" className="ghost-button">
                Buy from supplier
              </Link>
            </div>
            {listingOptions.length > 0 ? (
              <form action="/listings/save" method="post" className="stack-sm">
                <label>
                  Product
                  <select name="productId" defaultValue="">
                    <option value="" disabled>
                      Choose inventory
                    </option>
                    {listingOptions.map((item) => (
                        <option key={item.inventoryId} value={item.productId}>
                          {item.productName} - {item.availableToList} available to list
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Sale price
                  <input
                    name="price"
                    type="number"
                    min={0.01}
                    step="0.01"
                    defaultValue={defaultListingPrice}
                  />
                </label>
                <button type="submit">Publish listing</button>
              </form>
            ) : (
              <div className="empty-state">
                All of your current stock is already live in listings, or you need more stock first.
              </div>
            )}
          </section>

          <section className="card">
            <h2>Inventory</h2>
            <p className="muted">
              This section only shows stock that is not currently live in your shop.
            </p>
            <div className="table-list">
              {freeInventoryCount === 0 ? (
                <div className="empty-state">
                  All of your stock is currently moved into active listings.
                </div>
              ) : (
                visibleInventory.map((item) => (
                  <div key={item.inventoryId} className="table-row">
                    <div className="table-row__meta">
                      <strong>{item.productName}</strong>
                      <span className="muted">
                        Available in inventory: {item.availableToList} - Market average:{" "}
                        {formatCurrency(item.marketAveragePrice)}
                      </span>
                    </div>
                    <strong>{formatCurrency(item.marketAveragePrice)}</strong>
                  </div>
                ))
              )}
            </div>
            {freeInventoryCount > INVENTORY_PAGE_SIZE ? (
              <div className="section-row" style={{ marginTop: "1rem" }}>
                <span className="muted">
                  Showing page {inventoryPage} of your free inventory
                </span>
                <div className="table-row__actions">
                  {inventoryPage > 1 ? (
                    <a
                      href={buildDashboardHref(params, { inventoryPage: inventoryPage - 1 })}
                      className="ghost-button"
                    >
                      Previous
                    </a>
                  ) : null}
                  {hasNextInventoryPage ? (
                    <a
                      href={buildDashboardHref(params, { inventoryPage: inventoryPage + 1 })}
                      className="ghost-button"
                    >
                      Next
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="card">
            <h2>Shop listings</h2>
            {visibleListings.length === 0 ? (
              <div className="empty-state">
                You have not published any listings yet.
              </div>
            ) : (
              <div className="table-list">
                {visibleListings.map((listing) => (
                  <div key={listing.id} className="table-row">
                    <div className="table-row__meta">
                      <strong>{listing.product.name}</strong>
                      <span className="muted">
                        {formatCurrency(listing.price)} -{" "}
                        {listing.quantity > 0 ? `${listing.quantity} units live` : "Sold out"}
                      </span>
                    </div>
                    <div className="table-row__actions">
                      {listing.quantity > 0 ? (
                        <>
                          <form action="/listings/save" method="post" className="inline-form">
                            <input type="hidden" name="productId" value={listing.productId} />
                            <input
                              name="price"
                              type="number"
                              min={0.01}
                              step="0.01"
                              defaultValue={(listing.price / 100).toFixed(2)}
                            />
                            <button type="submit">Save</button>
                          </form>
                          <form action="/listings/pause" method="post">
                            <input type="hidden" name="listingId" value={listing.id} />
                            <button type="submit" className="ghost-button">
                              Remove
                            </button>
                          </form>
                        </>
                      ) : (
                        <span className="stock-chip stock-chip--soldout">Sold out</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {listingsPage > 1 || hasNextListingsPage ? (
              <div className="section-row" style={{ marginTop: "1rem" }}>
                <span className="muted">Showing page {listingsPage} of your listings</span>
                <div className="table-row__actions">
                  {listingsPage > 1 ? (
                    <a
                      href={buildDashboardHref(params, { listingsPage: listingsPage - 1 })}
                      className="ghost-button"
                    >
                      Previous
                    </a>
                  ) : null}
                  {hasNextListingsPage ? (
                    <a
                      href={buildDashboardHref(params, { listingsPage: listingsPage + 1 })}
                      className="ghost-button"
                    >
                      Next
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <h2>Recent sales</h2>
            {recentSales.length === 0 ? (
              <div className="empty-state">No sales yet. Once customers buy from you, sales will appear here.</div>
            ) : (
              <div className="table-list">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="table-row">
                    <div className="table-row__meta">
                      <strong>{sale.buyer.displayName}</strong>
                      <span className="muted">
                        {sale.lineItems.map((line) => `${line.quantity}x ${line.product.name}`).join(", ")}
                      </span>
                    </div>
                    <strong>{formatCurrency(sale.totalPrice)}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h2>Best-selling items</h2>
            {bestSellers.length === 0 ? (
              <div className="empty-state">Sales insights will appear once orders come in.</div>
            ) : (
              <div className="table-list">
                {bestSellers.map((item) => (
                  <div key={item.name} className="table-row">
                    <div className="table-row__meta">
                      <strong>{item.name}</strong>
                      <span className="muted">{item.units} units sold</span>
                    </div>
                    <strong>{formatCurrency(item.revenue)}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h2>Low-stock alerts</h2>
            {lowStockListings.length === 0 ? (
              <div className="empty-state">No low-stock listings right now.</div>
            ) : (
              <div className="table-list">
                {lowStockListings.map((listing) => (
                  <div key={listing.id} className="table-row">
                    <div className="table-row__meta">
                      <strong>{listing.product.name}</strong>
                      <span className="muted">Only {listing.quantity} left live in your shop</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h2>Alerts</h2>
            <div className="table-list">
              {unreadAlerts.map((notification) => (
                <div key={notification.id} className="notification-row unread">
                  <strong>{notification.type.replace("_", " ")}</strong>
                  <p className="muted">{notification.message}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
