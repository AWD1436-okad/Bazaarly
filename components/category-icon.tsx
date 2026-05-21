import type { ProductCategory } from "@prisma/client";
import {
  Apple,
  Beef,
  BookOpen,
  Boxes,
  Bubbles,
  CookingPot,
  Cookie,
  CupSoda,
  Home,
  Laptop,
  Milk,
  NotebookPen,
  Package,
  PackageOpen,
  Shirt,
  ShoppingBag,
  Smartphone,
  SprayCan,
  Sparkles,
  Utensils,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

type CategoryIconProps = {
  category?: ProductCategory | null;
  label?: string;
  size?: "sm" | "md" | "lg";
};

type CategoryIconStyle = {
  icon: LucideIcon;
  accent?: LucideIcon;
  foreground: string;
  background: string;
  glow: string;
};

const DEFAULT_CATEGORY_STYLE: CategoryIconStyle = {
  icon: PackageOpen,
  foreground: "#14532d",
  background: "linear-gradient(145deg, #f3ffe4, #a7f35d)",
  glow: "rgba(126, 211, 33, 0.34)",
};

const CATEGORY_ICON_STYLES: Partial<Record<ProductCategory, CategoryIconStyle>> = {
  FRUIT_AND_VEGETABLES: {
    icon: Apple,
    foreground: "#166534",
    background: "linear-gradient(145deg, #f4ffe8, #8de052)",
    glow: "rgba(141, 224, 82, 0.34)",
  },
  BAKERY_AND_GRAINS: {
    icon: Wheat,
    foreground: "#854d0e",
    background: "linear-gradient(145deg, #fff7d6, #f4c550)",
    glow: "rgba(244, 197, 80, 0.33)",
  },
  PANTRY_AND_COOKING: {
    icon: CookingPot,
    accent: Utensils,
    foreground: "#7c2d12",
    background: "linear-gradient(145deg, #fff2dd, #f59f4d)",
    glow: "rgba(245, 159, 77, 0.3)",
  },
  DRINKS: {
    icon: CupSoda,
    foreground: "#075985",
    background: "linear-gradient(145deg, #e0f8ff, #63cdf6)",
    glow: "rgba(99, 205, 246, 0.3)",
  },
  MEAT_DAIRY_AND_PROTEIN: {
    icon: Milk,
    accent: Beef,
    foreground: "#7f1d1d",
    background: "linear-gradient(145deg, #fff5f5, #fca5a5)",
    glow: "rgba(252, 165, 165, 0.32)",
  },
  SNACKS_AND_SWEETS: {
    icon: Cookie,
    foreground: "#78350f",
    background: "linear-gradient(145deg, #fff7ed, #fbbf24)",
    glow: "rgba(251, 191, 36, 0.3)",
  },
  KITCHEN_AND_COOKWARE: {
    icon: Utensils,
    accent: CookingPot,
    foreground: "#164e63",
    background: "linear-gradient(145deg, #ecfeff, #67e8f9)",
    glow: "rgba(103, 232, 249, 0.28)",
  },
  CLEANING_AND_PERSONAL_CARE: {
    icon: SprayCan,
    accent: Bubbles,
    foreground: "#155e75",
    background: "linear-gradient(145deg, #f0fdfa, #5eead4)",
    glow: "rgba(94, 234, 212, 0.28)",
  },
  CLOTHING: {
    icon: Shirt,
    accent: ShoppingBag,
    foreground: "#312e81",
    background: "linear-gradient(145deg, #eef2ff, #a5b4fc)",
    glow: "rgba(165, 180, 252, 0.31)",
  },
  MUSLIM_CLOTHING_AND_APPAREL: {
    icon: Shirt,
    accent: Sparkles,
    foreground: "#14532d",
    background: "linear-gradient(145deg, #f3ffe4, #86efac)",
    glow: "rgba(134, 239, 172, 0.34)",
  },
  HOME_AND_STORAGE: {
    icon: Home,
    accent: Boxes,
    foreground: "#365314",
    background: "linear-gradient(145deg, #f7fee7, #bef264)",
    glow: "rgba(190, 242, 100, 0.3)",
  },
  ELECTRONICS: {
    icon: Laptop,
    accent: Smartphone,
    foreground: "#1e3a8a",
    background: "linear-gradient(145deg, #eff6ff, #93c5fd)",
    glow: "rgba(147, 197, 253, 0.31)",
  },
  SCHOOL_AND_MISC: {
    icon: NotebookPen,
    accent: BookOpen,
    foreground: "#7c3aed",
    background: "linear-gradient(145deg, #faf5ff, #c4b5fd)",
    glow: "rgba(196, 181, 253, 0.3)",
  },
};

export function CategoryIcon({ category, label, size = "md" }: CategoryIconProps) {
  const iconStyle = (category && CATEGORY_ICON_STYLES[category]) || DEFAULT_CATEGORY_STYLE;
  const Icon = iconStyle.icon || Package;
  const AccentIcon = iconStyle.accent;
  const style = {
    "--category-icon-fg": iconStyle.foreground,
    "--category-icon-bg": iconStyle.background,
    "--category-icon-glow": iconStyle.glow,
  } as CSSProperties;

  return (
    <span
      className={["category-svg-icon", `category-svg-icon--${size}`].join(" ")}
      style={style}
      aria-hidden="true"
      title={label}
    >
      <Icon className="category-svg-icon__main" strokeWidth={2.4} />
      {AccentIcon ? <AccentIcon className="category-svg-icon__accent" strokeWidth={2.5} /> : null}
    </span>
  );
}
