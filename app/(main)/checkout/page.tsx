import Link from "next/link";
import { redirect } from "next/navigation";

import { CartItemQuantityForm } from "@/components/cart-item-quantity-form";
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

  return (
    <div className="page-grid">
      <section className="page-header">
        <h1>Secure checkout</h1>
        <p>Review everything, then confirm with your account password, checkout PIN, and bank number.</p>
      </section>

      {error ? (
        <div className="status-banner status-banner--error">
          <div>
            <h3>Checkout blocked</h3>
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      <section className="card">
        <div className="section-row">
          <div>
            <h2>Order summary</h2>
            <p>{cart.items.length} item type{cart.items.length === 1 ? "" : "s"} in this checkout.</p>
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

      <section className="card">
        <div className="section-row">
          <div>
            <h2>Confirm purchase</h2>
            <p>Wrong password, PIN, or bank number will leave your cart untouched.</p>
          </div>
          <Link className="ghost-button" href="/cart">
            Back to cart
          </Link>
        </div>

        <form action="/checkout/confirm" method="post" className="stack-sm">
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
          <button type="submit">Confirm checkout {formatCurrency(total, currencyCode)}</button>
        </form>
      </section>
    </div>
  );
}
