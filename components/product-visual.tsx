import type { CSSProperties } from "react";

import type { ProductCategory } from "@prisma/client";

type ProductVisualProps = {
  name: string;
  category: ProductCategory;
  tone?: "card" | "featured";
  className?: string;
};

type ProductVisualTokens = {
  emoji: string;
  badge: string;
  accent: string;
  glow: string;
  surface: string;
};

function getProductVisualTokens(name: string, category: ProductCategory): ProductVisualTokens {
  const normalizedName = name.toLowerCase();

  switch (category) {
    case "FRUIT_AND_VEGETABLES":
      if (/apple/.test(normalizedName)) return { emoji: "\u{1F34E}", badge: "\u{1F343}", accent: "#78b23b", glow: "rgba(120,178,59,0.35)", surface: "#eff9df" };
      if (/banana/.test(normalizedName)) return { emoji: "\u{1F34C}", badge: "\u2728", accent: "#e2c43a", glow: "rgba(226,196,58,0.35)", surface: "#fff7d6" };
      if (/broccoli|lettuce|spinach/.test(normalizedName)) return { emoji: "\u{1F96C}", badge: "\u{1F331}", accent: "#5b9b48", glow: "rgba(91,155,72,0.35)", surface: "#eaf8e3" };
      return { emoji: "\u{1F955}", badge: "\u{1F9FA}", accent: "#f09a36", glow: "rgba(240,154,54,0.35)", surface: "#fff1df" };
    case "MEAT_DAIRY_AND_PROTEIN":
      if (/fish/.test(normalizedName)) return { emoji: "\u{1F41F}", badge: "\u2744\uFE0F", accent: "#4e87b8", glow: "rgba(78,135,184,0.35)", surface: "#e9f4ff" };
      if (/milk|yogurt|butter|cheese/.test(normalizedName)) return { emoji: "\u{1F95B}", badge: "\u2728", accent: "#77a8d8", glow: "rgba(119,168,216,0.35)", surface: "#eef6ff" };
      if (/egg/.test(normalizedName)) return { emoji: "\u{1F95A}", badge: "\u{1F423}", accent: "#e1b15d", glow: "rgba(225,177,93,0.35)", surface: "#fff6e4" };
      return { emoji: "\u{1F969}", badge: "\u{1F525}", accent: "#bb5a48", glow: "rgba(187,90,72,0.35)", surface: "#fff0eb" };
    case "BAKERY_AND_GRAINS":
      if (/cake|muffin/.test(normalizedName)) return { emoji: "\u{1F9C1}", badge: "\u{1F370}", accent: "#cf7f8f", glow: "rgba(207,127,143,0.35)", surface: "#fff0f5" };
      if (/rice|oats/.test(normalizedName)) return { emoji: "\u{1F35A}", badge: "\u{1F963}", accent: "#bfa05f", glow: "rgba(191,160,95,0.35)", surface: "#f8f1df" };
      return { emoji: "\u{1F35E}", badge: "\u{1F9C8}", accent: "#c88d4d", glow: "rgba(200,141,77,0.35)", surface: "#fff2e3" };
    case "PANTRY_AND_COOKING":
      if (/oil/.test(normalizedName)) return { emoji: "\u{1FAD9}", badge: "\u{1F372}", accent: "#d78f3f", glow: "rgba(215,143,63,0.35)", surface: "#fff1de" };
      if (/honey|jam|peanut butter/.test(normalizedName)) return { emoji: "\u{1F36F}", badge: "\u2728", accent: "#bb684d", glow: "rgba(187,104,77,0.35)", surface: "#fff0ea" };
      return { emoji: "\u{1F96B}", badge: "\u{1F36F}", accent: "#bb684d", glow: "rgba(187,104,77,0.35)", surface: "#fff0ea" };
    case "SNACKS_AND_SWEETS":
      if (/chocolate|cookies|biscuits/.test(normalizedName)) return { emoji: "\u{1F36B}", badge: "\u{1F36A}", accent: "#9d6a52", glow: "rgba(157,106,82,0.35)", surface: "#f8eee8" };
      if (/ice cream|frozen yoghurt/.test(normalizedName)) return { emoji: "\u{1F368}", badge: "\u2728", accent: "#8f77d6", glow: "rgba(143,119,214,0.35)", surface: "#f2efff" };
      return { emoji: "\u{1F37F}", badge: "\u{1F95C}", accent: "#d5a63f", glow: "rgba(213,166,63,0.35)", surface: "#fff6df" };
    case "DRINKS":
      if (/coffee|chai|hot chocolate/.test(normalizedName)) return { emoji: "\u2615", badge: "\u{1FAD8}", accent: "#93694e", glow: "rgba(147,105,78,0.35)", surface: "#f7efe8" };
      if (/tea/.test(normalizedName)) return { emoji: "\u{1FAD6}", badge: "\u{1F343}", accent: "#5a9464", glow: "rgba(90,148,100,0.35)", surface: "#eef8ec" };
      if (/juice|mango nectar/.test(normalizedName)) return { emoji: "\u{1F9C3}", badge: "\u{1F34A}", accent: "#f19736", glow: "rgba(241,151,54,0.35)", surface: "#fff1df" };
      return { emoji: "\u{1F964}", badge: "\u{1F4A7}", accent: "#4a8cd3", glow: "rgba(74,140,211,0.35)", surface: "#edf5ff" };
    case "CLOTHING":
      if (/jacket|hoodie|sweater/.test(normalizedName)) return { emoji: "\u{1F9E5}", badge: "\u{1FAA1}", accent: "#6d76ad", glow: "rgba(109,118,173,0.35)", surface: "#f0f1fb" };
      return { emoji: "\u{1F455}", badge: "\u{1F9E2}", accent: "#c56d59", glow: "rgba(197,109,89,0.35)", surface: "#fff0eb" };
    case "SCHOOL_AND_MISC":
      if (/backpack|lunch box|bottle|umbrella|shopping bag/.test(normalizedName)) return { emoji: "\u{1F392}", badge: "\u270F\uFE0F", accent: "#5b92ca", glow: "rgba(91,146,202,0.35)", surface: "#edf5ff" };
      return { emoji: "\u{1F4D3}", badge: "\u270F\uFE0F", accent: "#5d90c7", glow: "rgba(93,144,199,0.35)", surface: "#eef5ff" };
    case "CLEANING_AND_PERSONAL_CARE":
      if (/detergent|dishwashing|tissues/.test(normalizedName)) return { emoji: "\u{1F9FD}", badge: "\u{1F9FC}", accent: "#5aa3a9", glow: "rgba(90,163,169,0.35)", surface: "#ebfbfb" };
      return { emoji: "\u{1F9F4}", badge: "\u{1FAA5}", accent: "#5ea8a1", glow: "rgba(94,168,161,0.35)", surface: "#ebfbf7" };
    case "KITCHEN_AND_COOKWARE":
      if (/knife|cutlery/.test(normalizedName)) return { emoji: "\u{1F52A}", badge: "\u{1F37D}\uFE0F", accent: "#74839b", glow: "rgba(116,131,155,0.35)", surface: "#eef2f7" };
      if (/pan|pot|oven|tray|colander/.test(normalizedName)) return { emoji: "\u{1F373}", badge: "\u{1F525}", accent: "#bb744a", glow: "rgba(187,116,74,0.35)", surface: "#fff1e7" };
      return { emoji: "\u{1F963}", badge: "\u2728", accent: "#7f8fbb", glow: "rgba(127,143,187,0.35)", surface: "#f0f3fb" };
    case "HOME_AND_STORAGE":
      if (/blanket|pillow|towel/.test(normalizedName)) return { emoji: "\u{1F6CF}\uFE0F", badge: "\u2728", accent: "#c48a55", glow: "rgba(196,138,85,0.35)", surface: "#fff2e6" };
      return { emoji: "\u{1F4E6}", badge: "\u{1F9FA}", accent: "#8f78c8", glow: "rgba(143,120,200,0.35)", surface: "#f3efff" };
    case "ELECTRONICS":
      if (/laptop|tablet/.test(normalizedName)) return { emoji: "\u{1F4BB}", badge: "\u26A1", accent: "#5b74c9", glow: "rgba(91,116,201,0.35)", surface: "#eef2ff" };
      return { emoji: "\u{1F4F1}", badge: "\u{1F50C}", accent: "#507fd6", glow: "rgba(80,127,214,0.35)", surface: "#edf4ff" };
    default:
      return { emoji: "\u{1F6CD}\uFE0F", badge: "\u2728", accent: "#6c9872", glow: "rgba(108,152,114,0.35)", surface: "#eef8ef" };
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
      <span className="product-visual__emoji">{tokens.emoji}</span>
      <span className="product-visual__badge">{tokens.badge}</span>
      <span className="product-visual__shine" />
    </div>
  );
}
