import type { Route } from "next";
import { BusinessLedgerEntryCategory, type Prisma } from "@prisma/client";
import Link from "next/link";
import { CurrencyDisplayNote } from "@/components/currency-display-note";
import { ProductVisual } from "@/components/product-visual";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
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

type ReceiptLine = {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

function getReceiptLines(data: Prisma.JsonValue | null, description: string, amount: number): ReceiptLine[] {
  if (data && typeof data === "object" && !Array.isArray(data) && Array.isArray(data.items)) {
    return data.items
      .map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return null;
        const productName = typeof item.productName === "string" ? item.productName : "Stock item";
        const quantity = typeof item.quantity === "number" ? item.quantity : 1;
        const unitPrice = typeof item.unitPrice === "number" ? item.unitPrice : Math.round(amount / Math.max(quantity, 1));
        const lineTotal = typeof item.lineTotal === "number" ? item.lineTotal : unitPrice * quantity;
        return { productName, quantity, unitPrice, lineTotal };
      })
      .filter((item): item is ReceiptLine => Boolean(item));
  }

  const summary = description.replace(/^Supplier stock purchase:\s*/i, "").replace(/^Marketplace stock purchase from .*?:\s*/i, "");
  if (!summary || summary === description) {
    return [{ productName: description, quantity: 1, unitPrice: amount, lineTotal: amount }];
  }

  return summary.split(",").map((part) => {
    const trimmed = part.trim();
    const match = trimmed.match(/^(\d+)x\s+(.+)$/i);
    const quantity = match ? Number(match[1]) : 1;
    return {
      productName: match ? match[2] : trimmed,
      quantity,
      unitPrice: Math.round(amount / Math.max(quantity, 1)),
      lineTotal: amount,
    };
  });
}

function getReceiptBalance(data: Prisma.JsonValue | null, key: "balanceBefore" | "balanceAfter") {
  if (data && typeof data === "object" && !Array.isArray(data) && typeof data[key] === "number") {
    return data[key];
  }

  return null;
}

function getReceiptTitle(data: Prisma.JsonValue | null) {
  if (data && typeof data === "object" && !Array.isArray(data) && data.source === "marketplace_checkout") {
    return "Marketplace stock checkout";
  }

  return "Supplier checkout";
}

export default async function OrdersPage({ searchParams }: OrdersProps) {
  const user = await requireUser();
  const currencyCode = await getActiveCurrencyCode(user.id);
  const params = (await searchParams) ?? {};
  const checkout = getSingleParam(params.checkout) === "1";
  const buyerPage = parsePositivePage(params.buyerPage);
  const sellerPage = parsePositivePage(params.sellerPage);

  const [buyerOrders, sellerOrders, stockPurchases] = await Promise.all([
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
            unitPrice: true,
            costUnitPrice: true,
            lineTotal: true,
            lineProfit: true,
            product: {
              select: {
                name: true,
                category: true,
                subcategory: true,
                imageUrl: true,
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
            unitPrice: true,
            costUnitPrice: true,
            lineTotal: true,
            lineProfit: true,
            product: {
              select: {
                name: true,
                category: true,
                subcategory: true,
                imageUrl: true,
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
    prisma.businessLedgerEntry.findMany({
      where: {
        userId: user.id,
        category: BusinessLedgerEntryCategory.STOCK_PURCHASE,
      },
      select: {
        id: true,
        amount: true,
        description: true,
        data: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: ORDER_HISTORY_PAGE_SIZE,
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
        <CurrencyDisplayNote currencyCode={currencyCode} />
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
          <div className="card-header">
            <div className="card-header__copy">
              <h2>Buyer history</h2>
            </div>
          </div>
          {visibleBuyerOrders.length === 0 ? (
            <div className="empty-state">No purchases yet.</div>
          ) : (
            <>
              <div className="table-list">
                {visibleBuyerOrders.map((order) => (
                  <div key={order.id} className="order-row">
                    <div className="table-row__meta table-row__meta--with-visual">
                      {order.lineItems[0] ? (
                        <ProductVisual
                          name={order.lineItems[0].product.name}
                          category={order.lineItems[0].product.category}
                          subcategory={order.lineItems[0].product.subcategory}
                          imageUrl={order.lineItems[0].product.imageUrl}
                        />
                      ) : null}
                      <div>
                        <strong>{order.shop.name}</strong>
                        <span className="muted">
                          {order.lineItems.map((line) => `${line.quantity}x ${line.product.name}`).join(", ")}
                        </span>
                      </div>
                    </div>
                    <div className="section-row">
                      <span>{order.createdAt.toLocaleString()}</span>
                       <strong>{formatCurrency(order.totalPrice, currencyCode)}</strong>
                    </div>
                  </div>
                ))}
              </div>
              {(hasPreviousBuyerPage || hasNextBuyerPage) && (
                <div className="section-row section-row--top-gap">
                  <p className="muted">
                    Showing buyer page {buyerPage}
                    {hasNextBuyerPage ? " with older purchases available." : "."}
                  </p>
                  <div className="inline-actions">
                    {hasPreviousBuyerPage ? (
                      <Link
                        href={buildOrdersHref({
                          checkout,
                          buyerPage: buyerPage - 1,
                          sellerPage,
                        }) as Route}
                        className="ghost-button"
                        scroll={false}
                      >
                        Previous
                      </Link>
                    ) : (
                      <span />
                    )}
                    {hasNextBuyerPage ? (
                      <Link
                        href={buildOrdersHref({
                          checkout,
                          buyerPage: buyerPage + 1,
                          sellerPage,
                        }) as Route}
                        className="ghost-button"
                        scroll={false}
                      >
                        Next
                      </Link>
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
          <div className="card-header">
            <div className="card-header__copy">
              <h2>Stock receipts</h2>
            </div>
          </div>
          {stockPurchases.length === 0 ? (
            <div className="empty-state">No stock purchases yet.</div>
          ) : (
            <div className="table-list">
              {stockPurchases.map((purchase) => {
                const receiptLines = getReceiptLines(purchase.data, purchase.description, purchase.amount);
                const balanceBefore = getReceiptBalance(purchase.data, "balanceBefore");
                const balanceAfter = getReceiptBalance(purchase.data, "balanceAfter");

                return (
                  <div key={purchase.id} className="order-row order-row--receipt">
                    <div className="receipt-row__header">
                      <div>
                        <strong>{getReceiptTitle(purchase.data)}</strong>
                        <span className="muted">{purchase.createdAt.toLocaleString()}</span>
                      </div>
                      <strong>{formatCurrency(purchase.amount, currencyCode)}</strong>
                    </div>
                    <div className="receipt-line-list">
                      {receiptLines.map((line, index) => (
                        <div key={`${purchase.id}-${line.productName}-${index}`} className="receipt-line">
                          <span>{line.quantity}x {line.productName}</span>
                          <strong>{formatCurrency(line.lineTotal, currencyCode)}</strong>
                        </div>
                      ))}
                    </div>
                    {balanceBefore !== null && balanceAfter !== null ? (
                      <div className="receipt-balance">
                        <span>Balance before: {formatCurrency(balanceBefore, currencyCode)}</span>
                        <strong>After: {formatCurrency(balanceAfter, currencyCode)}</strong>
                      </div>
                    ) : null}
                    <Link href="/dashboard" className="ghost-button small">
                      List this stock
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="card">
          <div className="card-header">
            <div className="card-header__copy">
              <h2>Seller history</h2>
            </div>
          </div>
          {visibleSellerOrders.length === 0 ? (
            <div className="empty-state">No sales yet.</div>
          ) : (
            <>
              <div className="table-list">
                {visibleSellerOrders.map((order) => (
                  <div key={order.id} className="order-row">
                    <div className="table-row__meta table-row__meta--with-visual">
                      {order.lineItems[0] ? (
                        <ProductVisual
                          name={order.lineItems[0].product.name}
                          category={order.lineItems[0].product.category}
                          subcategory={order.lineItems[0].product.subcategory}
                          imageUrl={order.lineItems[0].product.imageUrl}
                        />
                      ) : null}
                      <div>
                        <strong>{order.buyer.displayName}</strong>
                        <span className="muted">
                          {order.lineItems.map((line) => `${line.quantity}x ${line.product.name}`).join(", ")}
                        </span>
                      </div>
                    </div>
                    <div className="section-row">
                      <span>{order.createdAt.toLocaleString()}</span>
                       <div className="stack-xs align-end">
                         <strong>{formatCurrency(order.lineItems.reduce((sum, line) => sum + line.lineProfit, 0), currencyCode)} profit</strong>
                         <span className="muted">{formatCurrency(order.totalPrice, currencyCode)} revenue</span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
              {(hasPreviousSellerPage || hasNextSellerPage) && (
                <div className="section-row section-row--top-gap">
                  <p className="muted">
                    Showing seller page {sellerPage}
                    {hasNextSellerPage ? " with older sales available." : "."}
                  </p>
                  <div className="inline-actions">
                    {hasPreviousSellerPage ? (
                      <Link
                        href={buildOrdersHref({
                          checkout,
                          buyerPage,
                          sellerPage: sellerPage - 1,
                        }) as Route}
                        className="ghost-button"
                        scroll={false}
                      >
                        Previous
                      </Link>
                    ) : (
                      <span />
                    )}
                    {hasNextSellerPage ? (
                      <Link
                        href={buildOrdersHref({
                          checkout,
                          buyerPage,
                          sellerPage: sellerPage + 1,
                        }) as Route}
                        className="ghost-button"
                        scroll={false}
                      >
                        Next
                      </Link>
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
