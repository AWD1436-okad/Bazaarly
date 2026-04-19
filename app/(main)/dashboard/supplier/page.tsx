import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { prisma } from "@/lib/prisma";

const SUPPLIER_PAGE_SIZE = 18;

function buildSupplierHref(
  params: Record<string, string | string[] | undefined>,
  nextPage: number,
) {
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue;
    if (typeof value === "string" && value.length > 0) {
      nextParams.set(key, value);
    }
  }

  if (nextPage > 1) {
    nextParams.set("page", String(nextPage));
  }

  const queryString = nextParams.toString();
  return queryString ? `/dashboard/supplier?${queryString}` : "/dashboard/supplier";
}

type SupplierProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SupplierPage({ searchParams }: SupplierProps) {
  await requireUser();
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;
  const currentPage = Math.max(Number(params.page ?? "1") || 1, 1);
  const skip = (currentPage - 1) * SUPPLIER_PAGE_SIZE;

  const products = await prisma.marketProductState.findMany({
    select: {
      id: true,
      productId: true,
      currentSupplierPrice: true,
      trendLabel: true,
      supplierStock: true,
      marketAveragePrice: true,
      product: {
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          basePrice: true,
        },
      },
    },
    orderBy: [{ product: { category: "asc" } }, { product: { name: "asc" } }],
    skip,
    take: SUPPLIER_PAGE_SIZE + 1,
  });

  const hasNextPage = products.length > SUPPLIER_PAGE_SIZE;
  const visibleProducts = hasNextPage ? products.slice(0, SUPPLIER_PAGE_SIZE) : products;

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
        {visibleProducts.map((item) => (
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

            <form action="/supplier/buy" method="post" className="inline-form" style={{ marginTop: "1rem" }}>
              <input type="hidden" name="productId" value={item.productId} />
              <input type="number" name="quantity" min={1} defaultValue={1} max={item.supplierStock} />
              <button type="submit">Buy for {formatCurrency(item.currentSupplierPrice)}</button>
            </form>
          </article>
        ))}
      </section>

      <section className="card">
        <div className="section-row">
          <div>
            <strong>Page {currentPage}</strong>
            <p className="muted">
              Supplier inventory is loaded in smaller pages to keep Bazaarly lighter on
              the shared free-tier stack.
            </p>
          </div>
          <div className="table-row__actions">
            {currentPage > 1 ? (
              <a
                href={buildSupplierHref(params, currentPage - 1)}
                className="ghost-button"
              >
                Previous
              </a>
            ) : null}
            {hasNextPage ? (
              <a
                href={buildSupplierHref(params, currentPage + 1)}
                className="ghost-button"
              >
                Next
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
