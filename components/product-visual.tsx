import type { CSSProperties } from "react";

import type { ProductCategory } from "@prisma/client";

type ProductVisualProps = {
  name: string;
  category: ProductCategory;
  tone?: "card" | "featured";
  className?: string;
};

type ProductVisualTokens = {
  mark: string;
  badge: string;
  accent: string;
  glow: string;
  surface: string;
};

function getProductVisualTokens(name: string, category: ProductCategory): ProductVisualTokens {
  const normalizedName = name.toLowerCase();

  switch (category) {
    case "FRUIT_AND_VEGETABLES":
      if (/apple/.test(normalizedName)) return { mark: "AP", badge: "FR", accent: "#78b23b", glow: "rgba(120,178,59,0.35)", surface: "#eff9df" };
      if (/banana/.test(normalizedName)) return { mark: "BN", badge: "FR", accent: "#e2c43a", glow: "rgba(226,196,58,0.35)", surface: "#fff7d6" };
      if (/broccoli|lettuce|spinach/.test(normalizedName)) return { mark: "VG", badge: "GR", accent: "#5b9b48", glow: "rgba(91,155,72,0.35)", surface: "#eaf8e3" };
      return { mark: "FV", badge: "KG", accent: "#f09a36", glow: "rgba(240,154,54,0.35)", surface: "#fff1df" };
    case "MEAT_DAIRY_AND_PROTEIN":
      if (/fish/.test(normalizedName)) return { mark: "FI", badge: "KG", accent: "#4e87b8", glow: "rgba(78,135,184,0.35)", surface: "#e9f4ff" };
      if (/milk|yogurt|butter|cheese/.test(normalizedName)) return { mark: "DA", badge: "L", accent: "#77a8d8", glow: "rgba(119,168,216,0.35)", surface: "#eef6ff" };
      if (/egg/.test(normalizedName)) return { mark: "EG", badge: "DZ", accent: "#e1b15d", glow: "rgba(225,177,93,0.35)", surface: "#fff6e4" };
      return { mark: "PR", badge: "KG", accent: "#bb5a48", glow: "rgba(187,90,72,0.35)", surface: "#fff0eb" };
    case "BAKERY_AND_GRAINS":
      if (/cake|muffin/.test(normalizedName)) return { mark: "CK", badge: "PK", accent: "#cf7f8f", glow: "rgba(207,127,143,0.35)", surface: "#fff0f5" };
      if (/rice|oats/.test(normalizedName)) return { mark: "GR", badge: "KG", accent: "#bfa05f", glow: "rgba(191,160,95,0.35)", surface: "#f8f1df" };
      return { mark: "BK", badge: "EA", accent: "#c88d4d", glow: "rgba(200,141,77,0.35)", surface: "#fff2e3" };
    case "PANTRY_AND_COOKING":
      if (/oil/.test(normalizedName)) return { mark: "OL", badge: "L", accent: "#d78f3f", glow: "rgba(215,143,63,0.35)", surface: "#fff1de" };
      if (/honey|jam|peanut butter/.test(normalizedName)) return { mark: "JR", badge: "EA", accent: "#bb684d", glow: "rgba(187,104,77,0.35)", surface: "#fff0ea" };
      return { mark: "PT", badge: "EA", accent: "#bb684d", glow: "rgba(187,104,77,0.35)", surface: "#fff0ea" };
    case "SNACKS_AND_SWEETS":
      if (/chocolate|cookies|biscuits/.test(normalizedName)) return { mark: "SW", badge: "PK", accent: "#9d6a52", glow: "rgba(157,106,82,0.35)", surface: "#f8eee8" };
      if (/ice cream|frozen yoghurt/.test(normalizedName)) return { mark: "IC", badge: "TB", accent: "#8f77d6", glow: "rgba(143,119,214,0.35)", surface: "#f2efff" };
      return { mark: "SN", badge: "PK", accent: "#d5a63f", glow: "rgba(213,166,63,0.35)", surface: "#fff6df" };
    case "DRINKS":
      if (/coffee|chai|hot chocolate/.test(normalizedName)) return { mark: "CF", badge: "PK", accent: "#93694e", glow: "rgba(147,105,78,0.35)", surface: "#f7efe8" };
      if (/tea/.test(normalizedName)) return { mark: "TE", badge: "BX", accent: "#5a9464", glow: "rgba(90,148,100,0.35)", surface: "#eef8ec" };
      if (/juice/.test(normalizedName)) return { mark: "JC", badge: "L", accent: "#f19736", glow: "rgba(241,151,54,0.35)", surface: "#fff1df" };
      return { mark: "DR", badge: "L", accent: "#4a8cd3", glow: "rgba(74,140,211,0.35)", surface: "#edf5ff" };
    case "CLOTHING":
      if (/jacket|hoodie|sweater/.test(normalizedName)) return { mark: "OW", badge: "EA", accent: "#6d76ad", glow: "rgba(109,118,173,0.35)", surface: "#f0f1fb" };
      return { mark: "CL", badge: "EA", accent: "#c56d59", glow: "rgba(197,109,89,0.35)", surface: "#fff0eb" };
    case "SCHOOL_AND_MISC":
      if (/backpack|lunch box|bottle|umbrella|shopping bag/.test(normalizedName)) return { mark: "GO", badge: "EA", accent: "#5b92ca", glow: "rgba(91,146,202,0.35)", surface: "#edf5ff" };
      return { mark: "SC", badge: "EA", accent: "#5d90c7", glow: "rgba(93,144,199,0.35)", surface: "#eef5ff" };
    case "CLEANING_AND_PERSONAL_CARE":
      if (/detergent|dishwashing|tissues/.test(normalizedName)) return { mark: "CL", badge: "L", accent: "#5aa3a9", glow: "rgba(90,163,169,0.35)", surface: "#ebfbfb" };
      return { mark: "PC", badge: "EA", accent: "#5ea8a1", glow: "rgba(94,168,161,0.35)", surface: "#ebfbf7" };
    case "KITCHEN_AND_COOKWARE":
      if (/knife|cutlery/.test(normalizedName)) return { mark: "CT", badge: "SET", accent: "#74839b", glow: "rgba(116,131,155,0.35)", surface: "#eef2f7" };
      if (/pan|pot|oven|tray|colander/.test(normalizedName)) return { mark: "KW", badge: "EA", accent: "#bb744a", glow: "rgba(187,116,74,0.35)", surface: "#fff1e7" };
      return { mark: "KT", badge: "EA", accent: "#7f8fbb", glow: "rgba(127,143,187,0.35)", surface: "#f0f3fb" };
    case "HOME_AND_STORAGE":
      if (/blanket|pillow|towel/.test(normalizedName)) return { mark: "HM", badge: "EA", accent: "#c48a55", glow: "rgba(196,138,85,0.35)", surface: "#fff2e6" };
      return { mark: "ST", badge: "PK", accent: "#8f78c8", glow: "rgba(143,120,200,0.35)", surface: "#f3efff" };
    case "ELECTRONICS":
      if (/laptop|tablet/.test(normalizedName)) return { mark: "PC", badge: "EA", accent: "#5b74c9", glow: "rgba(91,116,201,0.35)", surface: "#eef2ff" };
      return { mark: "EL", badge: "EA", accent: "#507fd6", glow: "rgba(80,127,214,0.35)", surface: "#edf4ff" };
    default:
      return { mark: "BZ", badge: "EA", accent: "#6c9872", glow: "rgba(108,152,114,0.35)", surface: "#eef8ef" };
  }
}

export function ProductVisual({
  name,
  category,
  tone = "card",
  className,
}: ProductVisualProps) {
  const tokens = getProductVisualTokens(name, category);
  const style = {
    "--product-visual-accent": tokens.accent,
    "--product-visual-glow": tokens.glow,
    "--product-visual-surface": tokens.surface,
  } as CSSProperties;

  return (
    <div
      className={["product-visual", `product-visual--${tone}`, className].filter(Boolean).join(" ")}
      style={style}
      aria-hidden="true"
    >
      <span className="product-visual__backdrop" />
      <span className="product-visual__halo" />
      <span className="product-visual__emoji">{tokens.mark}</span>
      <span className="product-visual__badge">{tokens.badge}</span>
      <span className="product-visual__shine" />
    </div>
  );
}
