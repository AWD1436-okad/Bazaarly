import { buyFromSupplierAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { prisma } from "@/lib/prisma";

type SupplierProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SupplierPage({ searchParams }: SupplierProps) {
  await requireUser();
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;

  const products = await prisma.marketProductState.findMany({
    include: {
      product: true,
    },
    orderBy: [{ product: { category: "asc" } }, { product: { name: "asc" } }],
  });

  return (
    <div className="page-grid">
      <section className="page-header">
        <h1>Global supplier</h1>
        <p>
          Buy stock at current supplier prices, then list it in your shop for a profit.
        </p>
      </section>

      {error ? (
        <div className="status-banner status-banner--error">
          <div>
            <h3>Purchase needs attention</h3>
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      <section className="supplier-grid">
        {products.map((item) => (
          <article key={item.id} className="card">
            <div className="section-row">
              <div>
                <span className="category-chip">{item.product.category}</span>
                <h2>{item.product.name}</h2>
              </div>
              <strong>{formatCurrency(item.currentSupplierPrice)}</strong>
            </div>
            <p>{item.product.description}</p>
            <div className="stack-sm">
              <div className="section-row">
                <span className="muted">Market average</span>
                <strong>{formatCurrency(item.marketAveragePrice || item.product.basePrice)}</strong>
              </div>
              <div className="section-row">
                <span className="muted">Demand trend</span>
                <strong>{item.trendLabel}</strong>
              </div>
              <div className="section-row">
                <span className="muted">Supplier stock</span>
                <strong>{item.supplierStock}</strong>
              </div>
              <div className="section-row">
                <span className="muted">Potential gross margin</span>
                <strong>
                  {formatCurrency((item.marketAveragePrice || item.product.basePrice) - item.currentSupplierPrice)}
                </strong>
              </div>
            </div>

            <form action={buyFromSupplierAction} className="inline-form" style={{ marginTop: "1rem" }}>
              <input type="hidden" name="productId" value={item.productId} />
              <input type="number" name="quantity" min={1} defaultValue={1} max={item.supplierStock} />
              <button type="submit">Buy for {formatCurrency(item.currentSupplierPrice)}</button>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
