import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { prisma } from "@/lib/prisma";

type OrdersProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrdersPage({ searchParams }: OrdersProps) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const checkout = params.checkout === "1";

  const [buyerOrders, sellerOrders] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: user.id },
      include: {
        shop: true,
        lineItems: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { sellerId: user.id },
      include: {
        buyer: true,
        lineItems: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

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
          {buyerOrders.length === 0 ? (
            <div className="empty-state">No purchases yet.</div>
          ) : (
            <div className="table-list">
              {buyerOrders.map((order) => (
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
          )}
        </article>

        <article className="card">
          <h2>Seller history</h2>
          {sellerOrders.length === 0 ? (
            <div className="empty-state">No sales yet.</div>
          ) : (
            <div className="table-list">
              {sellerOrders.map((order) => (
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
          )}
        </article>
      </section>
    </div>
  );
}
