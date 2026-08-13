import { CartItemQuantityForm } from "@/components/cart-item-quantity-form";
import { ClearCartButton } from "@/components/clear-cart-button";
import { ProductVisual } from "@/components/product-visual";
import { RemoveRestockerPlanButton } from "@/components/remove-restocker-plan-button";
import { getPlanMeta } from "@/lib/auto-restock";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatPriceWithUnit } from "@/lib/money";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";
import { sanitizeStockCount } from "@/lib/stock";

type CartProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CartPage({ searchParams }: CartProps) {
  const user = await requireUser();
  const currencyCode = await getActiveCurrencyCode(user.id);
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;
  const added = params.added === "1";

  const cart = await prisma.cart.findFirst({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
    include: {
      shop: true,
      items: {
        include: {
          product: {
            include: {
              marketState: true,
            },
          },
          listing: {
            include: {
              shop: true,
            },
          },
        },
      },
    },
  });

  const total =
    (cart?.items.reduce((sum, item) => sum + item.quantity * item.unitPriceSnapshot, 0) ?? 0) +
    (cart?.autoRestockPlanPrice ?? 0);
  const hasUnavailableItems =
    cart?.items.some((item) => {
      const availableQuantity =
        item.source === "SUPPLIER"
          ? item.product.marketState?.supplierStock ?? 0
          : item.listing?.quantity ?? 0;
      return (
        availableQuantity <= 0 ||
        (item.source === "MARKETPLACE" && (!item.listing || !item.listing.active || item.listing.isPaused))
      );
    }) ?? false;

  return (
    <div className="page-grid cart-page">
      <section className="page-header">
        <h1>Your cart</h1>
      </section>

      {added ? (
        <div className="status-banner status-banner--success">
          <div>
            <h3>Added to cart</h3>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="status-banner status-banner--error">
          <div>
            <h3>Cart needs attention</h3>
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      {!cart || (cart.items.length === 0 && !cart.autoRestockPlan) ? (
        <div className="empty-state">Your cart is empty. Browse the marketplace or supplier to add something.</div>
      ) : (
        <>
          <section className="card">
            <div className="section-row">
              <div>
                <h2>Cart total</h2>
                <p>{cart.shop?.name ?? "Profit Planet Supplier"}</p>
              </div>
              <div className="cart-summary-actions">
                <strong>{formatCurrency(total, currencyCode)}</strong>
                <ClearCartButton />
              </div>
            </div>
          </section>

          <section className="card cart-checkout-card-top">
            <div className="section-row">
              <div>
                <h2>Checkout</h2>
              </div>
              <form action="/checkout" method="get">
                <button type="submit" disabled={hasUnavailableItems || (cart.items.length === 0 && !cart.autoRestockPlan)}>
                  {hasUnavailableItems ? "Update cart before checkout" : `Continue to Checkout ${formatCurrency(total, currencyCode)}`}
                </button>
              </form>
            </div>
          </section>

          <section className="card">
            <div className="table-list">
              {cart.autoRestockPlan && cart.autoRestockPlanPrice != null ? (
                <div className="table-row">
                  <div className="table-row__meta">
                    <strong>{getPlanMeta(cart.autoRestockPlan).name} Auto Restocker</strong>
                    <span className="muted">
                      First 24 hours - checks every {cart.autoRestockIntervalMinutes ?? 10} minutes
                    </span>
                  </div>
                  <div className="table-row__actions">
                    <strong>{formatCurrency(cart.autoRestockPlanPrice, currencyCode)}</strong>
                    <RemoveRestockerPlanButton />
                  </div>
                </div>
              ) : null}
              {cart.items.map((item) => {
                const availableQuantity =
                  item.source === "SUPPLIER"
                    ? item.product.marketState?.supplierStock ?? 0
                    : item.listing?.quantity ?? 0;
                const itemUnavailable =
                  availableQuantity <= 0 ||
                  (item.source === "MARKETPLACE" && (!item.listing || !item.listing.active || item.listing.isPaused));
                const sourceName =
                  item.source === "SUPPLIER"
                    ? "Profit Planet Supplier"
                    : item.listing?.shop.name ?? cart.shop?.name ?? "Marketplace shop";

                return (
                  <div key={item.id} className="table-row">
                    <div className="table-row__meta table-row__meta--with-visual">
                      <ProductVisual
                        name={item.product.name}
                        category={item.product.category}
                        subcategory={item.product.subcategory}
                        imageUrl={item.product.imageUrl}
                      />
                      <div>
                        <strong>{item.product.name}</strong>
                        <span className="muted">
                          {sourceName} - {formatPriceWithUnit(item.unitPriceSnapshot, item.product.unitLabel, currencyCode)} -{" "}
                          {itemUnavailable
                            ? "Sold out or unavailable since added to cart"
                            : `${sanitizeStockCount(availableQuantity)} available`}
                        </span>
                      </div>
                    </div>
                    <div className="table-row__actions">
                      <CartItemQuantityForm
                        cartItemId={item.id}
                        quantity={item.quantity}
                        maxQuantity={sanitizeStockCount(availableQuantity)}
                      />
                      <strong>{formatCurrency(item.quantity * item.unitPriceSnapshot, currencyCode)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </>
      )}
    </div>
  );
}
