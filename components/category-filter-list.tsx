import { getCategoryOptionDisplayLabel, type CategoryOption } from "@/lib/catalog";

type CategoryFilterListProps = {
  categories: readonly CategoryOption[];
  selectedCategory: string | null;
  buildHref: (category: string | null) => string;
  allLabel?: string;
};

const CATEGORY_EMOJI_OVERRIDES: Record<string, string> = {
  FRUIT_AND_VEGETABLES: "\u{1F34E}",
  BAKERY_AND_GRAINS: "\u{1F35E}",
  PANTRY_AND_COOKING: "\u{1F96B}",
  DRINKS: "\u{1F964}",
  MEAT_DAIRY_AND_PROTEIN: "\u{1F969}",
  SNACKS_AND_SWEETS: "\u{1F36B}",
  KITCHEN_AND_COOKWARE: "\u{1F373}",
  CLEANING_AND_PERSONAL_CARE: "\u{1F9FC}",
  CLOTHING: "\u{1F45F}",
  CLOTHING_MUSLIM_MEN: "\u{1F45E}",
  CLOTHING_MUSLIM_WOMEN: "\u{1F461}",
  HOME_AND_STORAGE: "\u{1F3E0}",
  ELECTRONICS: "\u{1F4F1}",
  SCHOOL_AND_MISC: "\u{1F392}",
};

export function CategoryFilterList({
  categories,
  selectedCategory,
  buildHref,
  allLabel = "All categories",
}: CategoryFilterListProps) {
  return (
    <nav aria-label="Category filters" className="category-filter-nav">
      <div className="category-filter-list">
        {categories.map((category) => {
          const isActive = selectedCategory === category.value;
          const emoji = CATEGORY_EMOJI_OVERRIDES[category.value] ?? category.emoji;
          const label = getCategoryOptionDisplayLabel(category);

          return (
            <a
              key={category.value}
              href={buildHref(category.value)}
              className={[
                "category-filter-link",
                isActive ? "category-filter-link--active" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="category-filter-link__emoji" aria-hidden="true">
                {emoji}
              </span>
              <span>{label}</span>
            </a>
          );
        })}
      </div>
      <a
        href={buildHref(null)}
        className={[
          "category-filter-link",
          "category-filter-link--all",
          selectedCategory ? null : "category-filter-link--active",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-current={selectedCategory ? undefined : "page"}
      >
        <span className="category-filter-link__emoji" aria-hidden="true">
          tx
        </span>
        <span>{allLabel}</span>
      </a>
    </nav>
  );
}
