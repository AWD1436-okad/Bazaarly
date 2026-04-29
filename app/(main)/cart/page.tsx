import { CartItemQuantityForm } from "@/components/cart-item-quantity-form";
import { ClearCartButton } from "@/components/clear-cart-button";
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
          listing: true,
        },
      },
    },
  });

  const total =
    cart?.items.reduce((sum, item) => sum + item.quantity * item.unitPriceSnapshot, 0) ?? 0;

  return (
    <div className="page-grid cart-page">
      <section className="page-header">
        <h1>Your cart</h1>
        <p>Review marketplace and supplier items before moving to secure checkout.</p>
      </section>

      {added ? (
        <div className="status-banner status-banner--success">
          <div>
            <h3>Added to cart</h3>
            <p>Your selected item is ready for checkout.</p>
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

      {!cart || cart.items.length === 0 ? (
        <div className="empty-state">Your cart is empty. Browse the marketplace or supplier to add something.</div>
      ) : (
        <>
          <section className="card">
            <div className="section-row">
              <div>
                <h2>Cart total</h2>
                <p>{cart.shop?.name ?? "Tradex Supplier"}</p>
              </div>
              <div className="cart-summary-actions">
                <strong>{formatCurrency(total, currencyCode)}</strong>
                <ClearCartButton />
              </div>
            </div>

            <div className="table-list">
              {cart.items.map((item) => {
                const availableQuantity =
                  item.source === "SUPPLIER"
                    ? item.product.marketState?.supplierStock ?? 0
                    : item.listing?.quantity ?? 0;
                const sourceName =
                  item.source === "SUPPLIER" ? "Tradex Supplier" : cart.shop?.name ?? "Marketplace shop";

                return (
                  <div key={item.id} className="table-row">
                    <div className="table-row__meta">
                      <strong>{item.product.name}</strong>
                      <span className="muted">
                        {sourceName} - {formatPriceWithUnit(item.unitPriceSnapshot, item.product.unitLabel, currencyCode)} -{" "}
                        {sanitizeStockCount(availableQuantity)} available
                      </span>
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

          <section className="card">
            <div className="section-row">
              <div>
                <h2>Checkout</h2>
                <p>Continue to the secure checkout screen to confirm with your password, PIN, and bank number.</p>
              </div>
              <form action="/checkout" method="get">
                <button type="submit">Checkout {formatCurrency(total, currencyCode)}</button>
              </form>
            </div>
          </section>

          <aside className="sticky-checkout-bar" aria-label="Cart checkout">
            <div>
              <span className="muted">Cart total</span>
              <strong>{formatCurrency(total, currencyCode)}</strong>
            </div>
            <form action="/checkout" method="get">
              <button type="submit">Checkout</button>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}
