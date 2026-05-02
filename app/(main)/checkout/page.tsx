import Link from "next/link";
import { redirect } from "next/navigation";

import { CartItemQuantityForm } from "@/components/cart-item-quantity-form";
import { CurrencyDisplayNote } from "@/components/currency-display-note";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatPriceWithUnit } from "@/lib/money";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";
import { sanitizeStockCount } from "@/lib/stock";

type CheckoutPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const user = await requireUser();
  const currencyCode = await getActiveCurrencyCode(user.id);
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;

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

  if (!cart || cart.items.length === 0) {
    redirect("/cart?error=Your%20cart%20is%20empty");
  }

  const total = cart.items.reduce((sum, item) => sum + item.quantity * item.unitPriceSnapshot, 0);
  const unavailableItems = cart.items.filter((item) => {
    const availableQuantity =
      item.source === "SUPPLIER"
        ? item.product.marketState?.supplierStock ?? 0
        : item.listing?.quantity ?? 0;
    return (
      availableQuantity <= 0 ||
      (item.source === "MARKETPLACE" && (!item.listing || !item.listing.active || item.listing.isPaused))
    );
  });
  const hasUnavailableItems = unavailableItems.length > 0;
  const priceChangedItems = cart.items.filter((item) => {
    if (item.source === "SUPPLIER") {
      return (
        item.product.marketState?.currentSupplierPrice !== undefined &&
        item.product.marketState.currentSupplierPrice !== item.unitPriceSnapshot
      );
    }

    return item.listing?.price !== undefined && item.listing.price !== item.unitPriceSnapshot;
  });

  return (
    <div className="page-grid checkout-page">
      <section className="page-header">
        <h1>Secure checkout</h1>
        <p>Review everything, then confirm with your account password, checkout PIN, and bank number.</p>
        <CurrencyDisplayNote currencyCode={currencyCode} />
      </section>

      {error ? (
        <div className="status-banner status-banner--error">
          <div>
            <h3>Checkout blocked</h3>
            <p>{error}</p>
          </div>
        </div>
      ) : null}
      {hasUnavailableItems ? (
        <div className="status-banner status-banner--warning">
          <div>
            <h3>Some cart items are no longer available</h3>
            <p>
              Remove or update these items before checkout:{" "}
              {unavailableItems.map((item) => item.product.name).join(", ")}.
            </p>
          </div>
        </div>
      ) : null}
      {priceChangedItems.length > 0 ? (
        <div className="status-banner status-banner--success">
          <div>
            <h3>Price changed since added</h3>
            <p>
              Your cart price is locked for: {priceChangedItems.map((item) => item.product.name).join(", ")}.
              Locked checkout amounts are stored in AUD and converted for display in {currencyCode}.
            </p>
          </div>
        </div>
      ) : null}

      <section className="card checkout-page__confirm-card">
        <div className="section-row">
          <div>
            <h2>Confirm purchase</h2>
            <p>
              {cart.items.length} item type{cart.items.length === 1 ? "" : "s"} in this checkout. Total{" "}
              <strong>{formatCurrency(total, currencyCode)}</strong>.
            </p>
            <p>Wrong password, PIN, or bank number will leave your cart untouched.</p>
          </div>
          <Link className="ghost-button" href="/cart">
            Back to cart
          </Link>
        </div>

        <form id="checkout-confirm-form" action="/checkout/confirm" method="post" className="stack-sm">
          <label>
            Account password
            <input name="password" type="password" required />
          </label>
          <label>
            Checkout PIN
            <input name="checkoutPin" type="password" inputMode="numeric" required />
          </label>
          <label>
            Bank number
            <input name="bankNumber" type="password" inputMode="numeric" required />
          </label>
          <button type="submit" className="checkout-main-submit" disabled={hasUnavailableItems}>
            {hasUnavailableItems
              ? "Update cart before confirming"
              : `Confirm Purchase ${formatCurrency(total, currencyCode)}`}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="section-row">
          <div>
            <h2>Order details</h2>
            <p>Review each cart line before final confirmation.</p>
          </div>
          <strong>{formatCurrency(total, currencyCode)}</strong>
        </div>

        <div className="table-list">
          {cart.items.map((item) => {
            const availableQuantity =
              item.source === "SUPPLIER"
                ? item.product.marketState?.supplierStock ?? 0
                : item.listing?.quantity ?? 0;
            const sourceName =
              item.source === "SUPPLIER"
                ? "Tradex Supplier"
                : item.listing?.shop.name ?? cart.shop?.name ?? "Marketplace shop";

            return (
              <div key={item.id} className="table-row">
                <div className="table-row__meta">
                  <strong>{item.product.name}</strong>
                  <span className="muted">
                    {sourceName} - Qty {item.quantity} -{" "}
                    {formatPriceWithUnit(item.unitPriceSnapshot, item.product.unitLabel, currencyCode)}
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
    </div>
  );
}
