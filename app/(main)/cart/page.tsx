import { requireUser } from "@/lib/auth";
import { formatCurrency, formatPriceWithUnit } from "@/lib/money";
import { prisma } from "@/lib/prisma";

type CartProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CartPage({ searchParams }: CartProps) {
  const user = await requireUser();
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
          product: true,
          listing: true,
        },
      },
    },
  });

  const total =
    cart?.items.reduce((sum, item) => sum + item.quantity * item.unitPriceSnapshot, 0) ?? 0;

  return (
    <div className="page-grid">
      <section className="page-header">
        <h1>Your cart</h1>
        <p>
          Bazaarly Version 1 checks out one seller at a time. Your cart preserves the shop each item came from.
        </p>
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
        <div className="empty-state">Your cart is empty. Browse the marketplace to add something.</div>
      ) : (
        <>
          <section className="card">
            <div className="section-row">
              <div>
                <h2>Seller</h2>
                <p>{cart.shop?.name}</p>
              </div>
              <strong>{formatCurrency(total)}</strong>
            </div>

            <div className="table-list">
              {cart.items.map((item) => (
                <div key={item.id} className="table-row">
                  <div className="table-row__meta">
                    <strong>{item.product.name}</strong>
                    <span className="muted">
                      {formatPriceWithUnit(item.unitPriceSnapshot, item.product.unitLabel)} ·{" "}
                      {item.listing.quantity} available
                    </span>
                  </div>
                  <div className="table-row__actions">
                    <form action="/cart/item" method="post" className="inline-form">
                      <input type="hidden" name="cartItemId" value={item.id} />
                      <input type="number" name="quantity" min={0} max={item.listing.quantity} defaultValue={item.quantity} />
                      <button type="submit">Update</button>
                    </form>
                    <strong>{formatCurrency(item.quantity * item.unitPriceSnapshot)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="section-row">
              <div>
                <h2>Checkout</h2>
                <p>
                  We re-check balance and stock inside a database transaction before the order is completed.
                </p>
              </div>
              <form action="/checkout" method="post">
                <button type="submit">Checkout {formatCurrency(total)}</button>
              </form>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
