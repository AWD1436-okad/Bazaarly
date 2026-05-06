export const APPEARANCE_PRESETS = [
  {
    value: "profit-planet-default",
    label: "Profit Planet Default",
    description: "Dark space panels, lime planet accents, and gold growth highlights.",
  },
  {
    value: "earth-market",
    label: "Planet Light",
    description: "Bright cream surfaces with green and gold business-game energy.",
  },
  {
    value: "midnight-trade",
    label: "Space Tycoon",
    description: "Deep navy and black with neon green and gold highlights.",
  },
  {
    value: "soft-light",
    label: "Eco Market",
    description: "Soft green, bark, and cream for a friendly marketplace feel.",
  },
  {
    value: "clean-compact",
    label: "Classic Clean",
    description: "Neutral, crisp, and simple with Profit Planet green-gold accents.",
  },
] as const;

export type AppearancePreset = (typeof APPEARANCE_PRESETS)[number]["value"];

export const DEFAULT_APPEARANCE_PRESET: AppearancePreset = "profit-planet-default";

export function normalizeAppearancePreset(value?: string | null): AppearancePreset {
  if (value === "current-tradex") {
    return DEFAULT_APPEARANCE_PRESET;
  }

  return APPEARANCE_PRESETS.some((preset) => preset.value === value)
    ? (value as AppearancePreset)
    : DEFAULT_APPEARANCE_PRESET;
}
