import { ProductCategory } from "@prisma/client";

import { DailyFeatureCard } from "@/components/daily-feature-card";
import { ProductVisual } from "@/components/product-visual";
import { CATEGORY_OPTIONS, getCategoryLabel, getDailyFeaturedProduct } from "@/lib/catalog";
import { requireUser } from "@/lib/auth";
import { formatPriceWithUnit } from "@/lib/money";
import { prisma } from "@/lib/prisma";

type CatalogPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function parseCategoryFilter(value: string | string[] | undefined) {
  if (typeof value !== "string" || value === "ALL") {
    return null;
  }

  return CATEGORY_OPTIONS.find((category) => category.value === value)?.value ?? null;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  await requireUser();
  const params = (await searchParams) ?? {};
  const selectedCategory = parseCategoryFilter(params.category);
  const searchQuery = typeof params.q === "string" ? params.q.trim() : "";
  const featuredProduct = getDailyFeaturedProduct();

  const products = await prisma.product.findMany({
    where: {
      ...(selectedCategory ? { category: selectedCategory as ProductCategory } : {}),
      ...(searchQuery
        ? {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      category: true,
      unitLabel: true,
      description: true,
      basePrice: true,
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="page-grid">
      <section className="hero-card supplier-hero">
        <div className="stack">
          <div>
            <span className="tag">Catalog</span>
            <h1>Browse the Bazaarly catalog</h1>
            <p>
              Explore the full product range by category, check unit pricing clearly,
              and use search inside the category you have selected.
            </p>
          </div>

          <form action="/dashboard/supplier" className="supplier-filter-row">
            <label>
              Category
              <select name="category" defaultValue={selectedCategory ?? "ALL"}>
                <option value="ALL">All categories</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Search
              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder={
                  selectedCategory
                    ? `Search inside ${getCategoryLabel(selectedCategory)}`
                    : "Search the full catalog"
                }
              />
            </label>
            <button type="submit">Apply</button>
            {(selectedCategory || searchQuery) ? (
              <a href="/dashboard/supplier" className="ghost-button">
                Clear
              </a>
            ) : null}
          </form>
        </div>

        <DailyFeatureCard
          product={featuredProduct}
          href={`/marketplace?q=${encodeURIComponent(featuredProduct.name)}&category=${featuredProduct.category}`}
          ctaLabel="View in marketplace"
          eyebrow="Today's catalog feature"
        />
      </section>

      <section className="page-header">
        <h2>{selectedCategory ? getCategoryLabel(selectedCategory) : "All catalog items"}</h2>
        <p>
          {products.length} item{products.length === 1 ? "" : "s"} shown
          {selectedCategory ? ` in ${getCategoryLabel(selectedCategory)}` : ""}.
          {searchQuery ? ` Search: "${searchQuery}".` : ""}
        </p>
      </section>

      {products.length === 0 ? (
        <div className="empty-state">
          No catalog items match that search inside the current category.
        </div>
      ) : (
        <section className="supplier-grid">
          {products.map((item) => (
            <article key={item.id} className="card">
              <ProductVisual
                name={item.name}
                category={item.category}
                tone="card"
                className="supplier-card__visual"
              />
              <div className="section-row">
                <div>
                  <span className="category-chip">{getCategoryLabel(item.category)}</span>
                  <h2>{item.name}</h2>
                </div>
                <strong>{formatPriceWithUnit(item.basePrice, item.unitLabel)}</strong>
              </div>
              <p>{item.description}</p>
              <div className="section-row">
                <span className="muted">Unit basis</span>
                <strong>{item.unitLabel}</strong>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
