import { ProductCategory } from "@prisma/client";

import { CategoryFilterList } from "@/components/category-filter-list";
import { CurrencyDisplayNote } from "@/components/currency-display-note";
import { SimulationHeartbeat } from "@/components/simulation-heartbeat";
import { StatusBanner } from "@/components/status-banner";
import { SupplierCategoryBulkAdd } from "@/components/supplier-category-bulk-add";
import { SupplierPurchaseForm } from "@/components/supplier-purchase-form";
import { SupplierRestockNeededModal } from "@/components/supplier-restock-needed-modal";
import { requireUser } from "@/lib/auth";
import {
  CATEGORY_OPTIONS,
  getCategoryFilterOption,
  getCategoryLabel,
  getCategoryOptionDisplayLabel,
  getProductCategoryLabel,
} from "@/lib/catalog";
import { formatPriceWithUnit } from "@/lib/money";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";
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
  supplierPrice: number;
  supplierStock: number;
};

type SoldOutRestockItem = {
  productId: string;
  name: string;
  category: ProductCategory;
  subcategory: string | null;
  unitLabel: string;
  supplierStock: number;
  supplierPrice: number;
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
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ");
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
      ...name.split(" "),
      ...category.split(" "),
      ...categoryDisplay.split(" "),
      ...description.split(" "),
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
    if (compactToken.startsWith(compactQuery) || compactQuery.startsWith(compactToken)) {
      return 620 - Math.abs(compactToken.length - compactQuery.length) * 12;
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
  const currencyCode = await getActiveCurrencyCode(user.id);
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
    supplierPrice: item.marketState?.currentSupplierPrice ?? 0,
    supplierStock: item.marketState?.supplierStock ?? 0,
  }));

  const soldOutListings = await prisma.listing.findMany({
    where: {
      shop: {
        ownerId: user.id,
      },
      quantity: { lte: 0 },
    },
    select: {
      productId: true,
      product: {
        select: {
          id: true,
          name: true,
          category: true,
          subcategory: true,
          unitLabel: true,
          marketState: {
            select: {
              currentSupplierPrice: true,
              supplierStock: true,
            },
          },
        },
      },
    },
    orderBy: {
      product: {
        name: "asc",
      },
    },
  });

  const soldOutRestockItems: SoldOutRestockItem[] = soldOutListings
    .map((listing) => ({
      productId: listing.product.id,
      name: listing.product.name,
      category: listing.product.category,
      subcategory: listing.product.subcategory,
      unitLabel: listing.product.unitLabel,
      supplierStock: listing.product.marketState?.supplierStock ?? 0,
      supplierPrice: listing.product.marketState?.currentSupplierPrice ?? 0,
    }))
    .filter((item) => item.supplierStock > 0 && item.supplierPrice > 0);

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
    <div className="page-grid">
      <SimulationHeartbeat intervalMs={70000} initialDelayMs={12000} />
      {purchaseSuccess ? (
        <StatusBanner
          tone="success"
          title={restockedListing ? "Supplier restock complete" : "Supplier purchase complete"}
          body={
            restockedListing
              ? "Your sold-out listing was restocked immediately and is live again."
              : "Your stock was added to inventory and is ready to list in your shop."
          }
        />
      ) : null}

      {error ? (
        <StatusBanner
          tone="error"
          title="Supplier order needs attention"
          body={error}
        />
      ) : null}

      <div className="catalog-layout">
        <aside className="category-sidebar">
          <div className="stack-sm">
            <span className="tag">Categories</span>
            <CategoryFilterList
              categories={CATEGORY_OPTIONS}
              selectedCategory={selectedCategory?.value ?? null}
              buildHref={(category) => buildSupplierHref(category)}
            />
          </div>
        </aside>

        <div className="stack">
          {!selectedCategory ? (
            <section className="card supplier-toolbar">
              <form action="/dashboard/supplier" className="supplier-filter-row">
                <label>
                  Search
                  <input
                    type="search"
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="Search supplier products"
                  />
                </label>
                <button type="submit">Search</button>
                {searchQuery ? (
                  <a href="/dashboard/supplier" className="ghost-button">
                    Clear
                  </a>
                ) : null}
              </form>
            </section>
          ) : null}

          <section className="page-header">
            <div>
              <h2>{selectedCategoryDisplayLabel ?? "All supplier items"}</h2>
              <p>
                {filteredProducts.length} item{filteredProducts.length === 1 ? "" : "s"} shown
                {selectedCategoryDisplayLabel ? ` in ${selectedCategoryDisplayLabel}` : ""}.
                {searchQuery ? ` Search: "${searchQuery}".` : ""}
              </p>
              <CurrencyDisplayNote currencyCode={currencyCode} />
            </div>
            {selectedCategory ? (
              <SupplierCategoryBulkAdd categoryValue={selectedCategory.value} />
            ) : null}
          </section>

          <SupplierRestockNeededModal
            currencyCode={currencyCode}
            items={soldOutRestockItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              categoryLabel: getProductCategoryLabel(item.category, item.subcategory),
              unitLabel: item.unitLabel,
              supplierStock: sanitizeStockCount(item.supplierStock),
              supplierPriceCents: item.supplierPrice,
              supplierPriceLabel: formatPriceWithUnit(
                item.supplierPrice,
                item.unitLabel,
                currencyCode,
              ),
            }))}
          />

          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              No supplier items match that search inside the current category.
            </div>
          ) : (
            <section className="supplier-grid">
              {filteredProducts.map((item) => (
                <article key={item.id} className="card supplier-card">
                  <div className="supplier-card__header">
                    <div className="supplier-card__title">
                      <span className="category-chip">
                        {getProductCategoryLabel(item.category, item.subcategory)}
                      </span>
                      <h2>{item.name}</h2>
                    </div>
                    <strong>{formatPriceWithUnit(item.supplierPrice, item.unitLabel, currencyCode)}</strong>
                  </div>

                  <p>{item.description}</p>

                  <div className="supplier-card__meta">
                    <span className="muted">Unit basis</span>
                    <strong>{item.unitLabel}</strong>
                    <span className="muted">Supplier stock</span>
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
