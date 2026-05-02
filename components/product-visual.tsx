import type { ProductCategory } from "@prisma/client";
import Image from "next/image";

type ProductVisualProps = {
  name: string;
  category?: ProductCategory | null;
  subcategory?: string | null;
  imageUrl?: string | null;
  size?: "compact" | "card" | "hero";
};

const CATEGORY_VISUALS: Record<ProductCategory, string> = {
  FRUIT_AND_VEGETABLES: "\u{1F34E}",
  BAKERY_AND_GRAINS: "\u{1F35E}",
  PANTRY_AND_COOKING: "\u{1F96B}",
  DRINKS: "\u{1F964}",
  MEAT_DAIRY_AND_PROTEIN: "\u{1F969}",
  SNACKS_AND_SWEETS: "\u{1F36B}",
  KITCHEN_AND_COOKWARE: "\u{1F373}",
  CLEANING_AND_PERSONAL_CARE: "\u{1F9FC}",
  CLOTHING: "\u{1F45F}",
  HOME_AND_STORAGE: "\u{1F3E0}",
  ELECTRONICS: "\u{1F4F1}",
  SCHOOL_AND_MISC: "\u{1F392}",
};

function getFallbackVisual(category?: ProductCategory | null, subcategory?: string | null) {
  if (category === "CLOTHING" && subcategory === "Men Muslim Clothes") {
    return "\u{1F45E}";
  }

  if (category === "CLOTHING" && subcategory === "Female Muslim Clothes") {
    return "\u{1F461}";
  }

  return category ? CATEGORY_VISUALS[category] : "tx";
}

export function ProductVisual({
  name,
  category,
  subcategory,
  imageUrl,
  size = "compact",
}: ProductVisualProps) {
  const className = ["product-visual", `product-visual--${size}`].join(" ");

  return (
    <span className={className} aria-hidden="true">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={size === "hero" ? "180px" : size === "card" ? "120px" : "56px"}
          className="product-visual__image"
          unoptimized
        />
      ) : (
        <span className="product-visual__fallback" title={name}>
          {getFallbackVisual(category, subcategory)}
        </span>
      )}
    </span>
  );
}
