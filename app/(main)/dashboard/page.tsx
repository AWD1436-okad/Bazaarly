import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBanner } from "@/components/status-banner";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { prisma } from "@/lib/prisma";

type DashboardProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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

  const [inventory, listings, recentSales, lowStockListings, unreadAlerts, bestSellerGroups] =
    await Promise.all([
      prisma.inventory.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          userId: true,
          productId: true,
          quantity: true,
          allocatedQuantity: true,
          averageUnitCost: true,
          updatedAt: true,
          product: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              marketState: true,
            },
          },
        },
        orderBy: { product: { name: "asc" } },
      }),
      prisma.listing.findMany({
        where: { shopId: user.shop.id },
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
      }),
      prisma.order.findMany({
        where: { sellerId: user.id },
        select: {
          id: true,
          totalPrice: true,
          createdAt: true,
          buyer: true,
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
        include: { product: true },
      }),
      prisma.notification.findMany({
        where: {
          userId: user.id,
          read: false,
          type: { in: ["LOW_STOCK", "SALE"] },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.orderLineItem.groupBy({
        where: {
          order: {
            sellerId: user.id,
          },
        },
        by: ["productId"],
        _sum: {
          quantity: true,
          lineTotal: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 4,
      }),
    ]);

  const inventoryWithAvailable = inventory.map((item) => ({
    ...item,
    availableToList: item.quantity - item.allocatedQuantity,
    marketAveragePrice: item.product.marketState?.marketAveragePrice || item.product.basePrice,
  }));
  const freeInventory = inventoryWithAvailable.filter((item) => item.availableToList > 0);
  const visibleListings = listings.filter((listing) => listing.active || listing.quantity <= 0);
  const defaultListingPrice =
    freeInventory.length > 0 ? (freeInventory[0].marketAveragePrice / 100).toFixed(2) : "2.50";

  const todayRevenue = recentSales
    .filter((order) => order.createdAt.toDateString() === new Date().toDateString())
    .reduce((sum, order) => sum + order.totalPrice, 0);

  const hasListings = visibleListings.some((listing) => listing.quantity > 0);
  const hasInventory = inventory.some((item) => item.quantity > 0);
  const bestSellerProducts =
    bestSellerGroups.length > 0
      ? await prisma.product.findMany({
          where: {
            id: {
              in: bestSellerGroups.map((item) => item.productId),
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

  const productNameMap = new Map(bestSellerProducts.map((product) => [product.id, product.name]));
  const bestSellers = bestSellerGroups.map((item) => ({
    name: productNameMap.get(item.productId) ?? "Unknown product",
    units: item._sum.quantity ?? 0,
    revenue: item._sum.lineTotal ?? 0,
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
            {freeInventory.length > 0 ? (
              <form action="/listings/save" method="post" className="stack-sm">
                <label>
                  Product
                  <select name="productId" defaultValue="">
                    <option value="" disabled>
                      Choose inventory
                    </option>
                    {freeInventory.map((item) => (
                        <option key={item.id} value={item.productId}>
                          {item.product.name} - {item.availableToList} available to list
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
              {freeInventory.length === 0 ? (
                <div className="empty-state">
                  All of your stock is currently moved into active listings.
                </div>
              ) : (
                freeInventory.map((item) => (
                  <div key={item.id} className="table-row">
                    <div className="table-row__meta">
                      <strong>{item.product.name}</strong>
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
