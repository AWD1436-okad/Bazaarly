import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { prisma } from "@/lib/prisma";

type OrdersProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const ORDER_HISTORY_PAGE_SIZE = 10;

function getSingleParam(
  value: string | string[] | undefined,
  fallback = "",
) {
  return typeof value === "string" ? value : fallback;
}

function parsePositivePage(value: string | string[] | undefined) {
  const parsed = Number(getSingleParam(value, "1"));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function buildOrdersHref({
  checkout,
  buyerPage,
  sellerPage,
}: {
  checkout: boolean;
  buyerPage: number;
  sellerPage: number;
}) {
  const params = new URLSearchParams();

  if (checkout) {
    params.set("checkout", "1");
  }

  if (buyerPage > 1) {
    params.set("buyerPage", String(buyerPage));
  }

  if (sellerPage > 1) {
    params.set("sellerPage", String(sellerPage));
  }

  const query = params.toString();
  return query ? `/orders?${query}` : "/orders";
}

export default async function OrdersPage({ searchParams }: OrdersProps) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const checkout = getSingleParam(params.checkout) === "1";
  const buyerPage = parsePositivePage(params.buyerPage);
  const sellerPage = parsePositivePage(params.sellerPage);

  const [buyerOrders, sellerOrders] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: user.id },
      select: {
        id: true,
        totalPrice: true,
        createdAt: true,
        shop: {
          select: {
            name: true,
          },
        },
        lineItems: {
          select: {
            quantity: true,
            product: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (buyerPage - 1) * ORDER_HISTORY_PAGE_SIZE,
      take: ORDER_HISTORY_PAGE_SIZE + 1,
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
            quantity: true,
            product: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (sellerPage - 1) * ORDER_HISTORY_PAGE_SIZE,
      take: ORDER_HISTORY_PAGE_SIZE + 1,
    }),
  ]);
  const visibleBuyerOrders = buyerOrders.slice(0, ORDER_HISTORY_PAGE_SIZE);
  const visibleSellerOrders = sellerOrders.slice(0, ORDER_HISTORY_PAGE_SIZE);
  const hasNextBuyerPage = buyerOrders.length > ORDER_HISTORY_PAGE_SIZE;
  const hasNextSellerPage = sellerOrders.length > ORDER_HISTORY_PAGE_SIZE;
  const hasPreviousBuyerPage = buyerPage > 1;
  const hasPreviousSellerPage = sellerPage > 1;

  return (
    <div className="page-grid">
      <section className="page-header">
        <h1>Order history</h1>
        <p>Review both sides of your Bazaarly economy: what you bought and what you sold.</p>
      </section>

      {checkout ? (
        <div className="status-banner status-banner--success">
          <div>
            <h3>Checkout successful</h3>
            <p>Your balance, order history, stock, and seller payout have all been updated.</p>
          </div>
        </div>
      ) : null}

      <section className="orders-grid">
        <article className="card">
          <h2>Buyer history</h2>
          {visibleBuyerOrders.length === 0 ? (
            <div className="empty-state">No purchases yet.</div>
          ) : (
            <>
              <div className="table-list">
                {visibleBuyerOrders.map((order) => (
                  <div key={order.id} className="order-row">
                    <strong>{order.shop.name}</strong>
                    <span className="muted">
                      {order.lineItems.map((line) => `${line.quantity}x ${line.product.name}`).join(", ")}
                    </span>
                    <div className="section-row">
                      <span>{order.createdAt.toLocaleString()}</span>
                      <strong>{formatCurrency(order.totalPrice)}</strong>
                    </div>
                  </div>
                ))}
              </div>
              {(hasPreviousBuyerPage || hasNextBuyerPage) && (
                <div className="section-row">
                  <p className="muted">
                    Showing buyer page {buyerPage}
                    {hasNextBuyerPage ? " with older purchases available." : "."}
                  </p>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    {hasPreviousBuyerPage ? (
                      <a
                        href={buildOrdersHref({
                          checkout,
                          buyerPage: buyerPage - 1,
                          sellerPage,
                        })}
                      >
                        Previous
                      </a>
                    ) : (
                      <span />
                    )}
                    {hasNextBuyerPage ? (
                      <a
                        href={buildOrdersHref({
                          checkout,
                          buyerPage: buyerPage + 1,
                          sellerPage,
                        })}
                      >
                        Next
                      </a>
                    ) : (
                      <span />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </article>

        <article className="card">
          <h2>Seller history</h2>
          {visibleSellerOrders.length === 0 ? (
            <div className="empty-state">No sales yet.</div>
          ) : (
            <>
              <div className="table-list">
                {visibleSellerOrders.map((order) => (
                  <div key={order.id} className="order-row">
                    <strong>{order.buyer.displayName}</strong>
                    <span className="muted">
                      {order.lineItems.map((line) => `${line.quantity}x ${line.product.name}`).join(", ")}
                    </span>
                    <div className="section-row">
                      <span>{order.createdAt.toLocaleString()}</span>
                      <strong>{formatCurrency(order.totalPrice)}</strong>
                    </div>
                  </div>
                ))}
              </div>
              {(hasPreviousSellerPage || hasNextSellerPage) && (
                <div className="section-row">
                  <p className="muted">
                    Showing seller page {sellerPage}
                    {hasNextSellerPage ? " with older sales available." : "."}
                  </p>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    {hasPreviousSellerPage ? (
                      <a
                        href={buildOrdersHref({
                          checkout,
                          buyerPage,
                          sellerPage: sellerPage - 1,
                        })}
                      >
                        Previous
                      </a>
                    ) : (
                      <span />
                    )}
                    {hasNextSellerPage ? (
                      <a
                        href={buildOrdersHref({
                          checkout,
                          buyerPage,
                          sellerPage: sellerPage + 1,
                        })}
                      >
                        Next
                      </a>
                    ) : (
                      <span />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </article>
      </section>
    </div>
  );
}
