import { ProductCategory } from "@prisma/client";

import { CategoryFilterList } from "@/components/category-filter-list";
import { CurrencyDisplayNote } from "@/components/currency-display-note";
import { ProductVisual } from "@/components/product-visual";
import { SimulationHeartbeat } from "@/components/simulation-heartbeat";
import { StatusBanner } from "@/components/status-banner";
import { SupplierCategoryBulkAdd } from "@/components/supplier-category-bulk-add";
import { SupplierPurchaseForm } from "@/components/supplier-purchase-form";
import { requireUser } from "@/lib/auth";
import {
  CATEGORY_OPTIONS,
  getCategoryFilterOption,
  getCategoryLabel,
  getCategoryOptionDisplayLabel,
  getProductCategoryLabel,
} from "@/lib/catalog";
import { formatPriceWithUnit } from "@/lib/money";
import { getPlayerModeConfig } from "@/lib/player-mode";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";
import { getSearchTokenVariants, normalizeSearchText, tokenizeSearchText } from "@/lib/search-utils";
import { prepareNpcShopsForSharedSupplier } from "@/lib/simulation";
import { sanitizeStockCount } from "@/lib/stock";

type SupplierPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SupplierProduct = {
  id: string;
  name: string;
  category: ProductCategory;
  subcategory: string | null;
  unitLabel: string;
  description: string;
  imageUrl: string | null;
  supplierPrice: number;
  supplierStock: number;
};

function parseCategoryFilter(value: string | string[] | undefined) {
  if (typeof value !== "string" || value === "ALL") {
    return null;
  }

  return getCategoryFilterOption(value);
}

function buildSupplierHref(category: string | null) {
  const params = new URLSearchParams();

  if (category) {
    params.set("category", category);
  }

  const query = params.toString();
  return query ? `/dashboard/supplier?${query}` : "/dashboard/supplier";
}

function normalizeSearchValue(value: string) {
  return normalizeSearchText(value);
}

function levenshteinDistance(left: string, right: string) {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  const row = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = i - 1;
    row[0] = i;

    for (let j = 1; j <= right.length; j += 1) {
      const previous = row[j];
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;

      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + substitutionCost);
      diagonal = previous;
    }
  }

  return row[right.length];
}

function getFuzzyScore(product: SupplierProduct, rawQuery: string) {
  const query = normalizeSearchValue(rawQuery);
  if (!query) return 0;

  const name = normalizeSearchValue(product.name);
  const category = normalizeSearchValue(getCategoryLabel(product.category));
  const categoryDisplay = normalizeSearchValue(
    getProductCategoryLabel(product.category, product.subcategory),
  );
  const description = normalizeSearchValue(product.description);
  const searchableTokens = Array.from(
    new Set([
      ...tokenizeSearchText(name),
      ...tokenizeSearchText(category),
      ...tokenizeSearchText(categoryDisplay),
      ...tokenizeSearchText(description),
    ]),
  ).filter(Boolean);

  if (name.includes(query)) return 1000 - name.indexOf(query);
  if (category.includes(query)) return 700;
  if (categoryDisplay.includes(query)) return 760;
  if (description.includes(query)) return 500;

  const compactQuery = query.replace(/\s+/g, "");
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const token of searchableTokens) {
    const compactToken = token.replace(/\s+/g, "");

    if (!compactToken) continue;
    const queryVariants = getSearchTokenVariants(compactQuery);
    for (const queryVariant of queryVariants) {
      if (compactToken.startsWith(queryVariant) || queryVariant.startsWith(compactToken)) {
        return 640 - Math.abs(compactToken.length - queryVariant.length) * 10;
      }
    }

    bestDistance = Math.min(bestDistance, levenshteinDistance(compactQuery, compactToken));
  }

  const maxDistance = compactQuery.length <= 4 ? 1 : compactQuery.length <= 8 ? 2 : 3;

  if (bestDistance <= maxDistance) {
    return 450 - bestDistance * 80;
  }

  return -1;
}

export default async function SupplierPage({ searchParams }: SupplierPageProps) {
  const user = await requireUser();
  // Bot shops start empty and can only refill through the shared supplier pool.
  await prepareNpcShopsForSharedSupplier(new Date());
  const currencyCode = await getActiveCurrencyCode(user.id);
  const playerModeConfig = getPlayerModeConfig((user as { playerMode?: unknown }).playerMode);
  const params = (await searchParams) ?? {};
  const selectedCategory = parseCategoryFilter(params.category);
  const selectedCategoryDisplayLabel = selectedCategory
    ? getCategoryOptionDisplayLabel(selectedCategory)
    : null;
  const searchQuery = typeof params.q === "string" ? params.q.trim() : "";
  const purchaseSuccess = params.purchase === "1";
  const restockedListing = params.restocked === "1";
  const error = typeof params.error === "string" ? params.error : null;

  const products = await prisma.product.findMany({
    where: {
      ...(selectedCategory
        ? {
            category: selectedCategory.category ?? (selectedCategory.value as ProductCategory),
            ...(selectedCategory.subcategory !== undefined
              ? { subcategory: selectedCategory.subcategory }
              : {}),
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      category: true,
      subcategory: true,
      unitLabel: true,
      description: true,
      imageUrl: true,
      marketState: {
        select: {
          currentSupplierPrice: true,
          supplierStock: true,
        },
      },
    },
    orderBy: [{ name: "asc" }],
  });

  const supplierProducts: SupplierProduct[] = products.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    subcategory: item.subcategory,
    unitLabel: item.unitLabel,
    description: item.description,
    imageUrl: item.imageUrl,
    supplierPrice: item.marketState?.currentSupplierPrice ?? 0,
    supplierStock: item.marketState?.supplierStock ?? 0,
  }));

  const filteredProducts = searchQuery
    ? supplierProducts
        .map((item) => ({
          item,
          fuzzyScore: getFuzzyScore(item, searchQuery),
        }))
        .filter((entry) => entry.fuzzyScore >= 0)
        .sort((left, right) => {
          if (right.fuzzyScore !== left.fuzzyScore) {
            return right.fuzzyScore - left.fuzzyScore;
          }

          return left.item.name.localeCompare(right.item.name);
        })
        .map((entry) => entry.item)
    : supplierProducts;

  return (
    <div className={`page-grid ${playerModeConfig.bodyClass}`}>
      <SimulationHeartbeat intervalMs={70000} initialDelayMs={12000} />
      {purchaseSuccess ? (
        <StatusBanner
          tone="success"
          title={restockedListing ? "Supplier restock complete" : "Supplier purchase complete"}
          body={
            restockedListing
              ? "Your sold-out listing was restocked immediately and is live again."
              : "Your stock was added to items you own and is ready to sell."
          }
        />
      ) : null}

      {error ? (
        <StatusBanner
          tone="error"
          title="Stock order needs attention"
          body={error}
        />
      ) : null}

      <div className="catalog-layout catalog-layout--supplier">
        <div className="stack">
          <section className="card supplier-toolbar">
            <div className="supplier-filter-layout">
              <form action="/dashboard/supplier" className="supplier-filter-row">
                {selectedCategory ? <input type="hidden" name="category" value={selectedCategory.value} /> : null}
                <label>
                  Search
                  <input
                    type="search"
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="Search stock to buy"
                  />
                </label>
                <button type="submit">Search</button>
                {searchQuery ? (
                  <a href={buildSupplierHref(selectedCategory?.value ?? null)} className="ghost-button">
                    Clear
                  </a>
                ) : null}
              </form>
              {playerModeConfig.value === "LITTLE" ? null : (
                <details className="category-disclosure supplier-category-disclosure">
                  <summary>Show categories</summary>
                  <div className="category-disclosure__content">
                    <CategoryFilterList
                      categories={CATEGORY_OPTIONS}
                      selectedCategory={selectedCategory?.value ?? null}
                      buildHref={(category) => buildSupplierHref(category)}
                    />
                  </div>
                </details>
              )}
            </div>
          </section>

          <section className="page-header">
            <div>
              <h2>
                {playerModeConfig.value === "LITTLE"
                  ? "Buy Things"
                  : selectedCategoryDisplayLabel ?? "All stock to buy"}
              </h2>
              {playerModeConfig.value === "LITTLE" ? null : (
                <span className="tag">
                  {filteredProducts.length} item{filteredProducts.length === 1 ? "" : "s"}
                  {searchQuery ? ` for "${searchQuery}"` : ""}
                </span>
              )}
              <CurrencyDisplayNote currencyCode={currencyCode} />
            </div>
            {selectedCategory && playerModeConfig.showAdvancedControls ? (
              <SupplierCategoryBulkAdd categoryValue={selectedCategory.value} />
            ) : null}
          </section>

          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              No stock items match that search inside the current category.
            </div>
          ) : (
            <section className="supplier-grid">
              {filteredProducts.map((item) => (
                <article key={item.id} className="card supplier-card">
                  <div className="supplier-card__header">
                    <div className="product-heading">
                      <ProductVisual
                        name={item.name}
                        category={item.category}
                        subcategory={item.subcategory}
                        imageUrl={item.imageUrl}
                        size="card"
                      />
                      <div className="supplier-card__title">
                        <span className="category-chip">
                          {getProductCategoryLabel(item.category, item.subcategory)}
                        </span>
                        <h2>{item.name}</h2>
                      </div>
                    </div>
                    <strong className="supplier-card__price">
                      {formatPriceWithUnit(item.supplierPrice, item.unitLabel, currencyCode)}
                    </strong>
                  </div>

                  <p className="supplier-card__description">{item.description}</p>

                  <div className="supplier-card__meta">
                    <span className="muted">Sold as</span>
                    <strong>{item.unitLabel || "each"}</strong>
                    <span className="muted">Stock available</span>
                    <strong>{sanitizeStockCount(item.supplierStock)}</strong>
                  </div>

                  <SupplierPurchaseForm
                    productId={item.id}
                    supplierStock={item.supplierStock}
                  />
                </article>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
