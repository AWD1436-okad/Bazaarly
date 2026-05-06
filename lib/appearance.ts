export const APPEARANCE_PRESETS = [
  {
    value: "current-tradex",
    label: "Current Tradex",
    description: "The familiar purple and blue Logo-4 marketplace style.",
  },
  {
    value: "earth-market",
    label: "Earth Market",
    description: "Final-logo brown, green, and black with a premium trading-game feel.",
  },
  {
    value: "midnight-trade",
    label: "Midnight Trade",
    description: "Dark trading-floor panels with cyan and emerald lighting.",
  },
  {
    value: "soft-light",
    label: "Soft Light",
    description: "Clean ivory surfaces with sage and sky accents for a calmer mood.",
  },
  {
    value: "clean-compact",
    label: "Arcade Market",
    description: "A playful premium market look with coral, teal, and gold energy.",
  },
] as const;

export type AppearancePreset = (typeof APPEARANCE_PRESETS)[number]["value"];

export const DEFAULT_APPEARANCE_PRESET: AppearancePreset = "current-tradex";

export function normalizeAppearancePreset(value?: string | null): AppearancePreset {
  return APPEARANCE_PRESETS.some((preset) => preset.value === value)
    ? (value as AppearancePreset)
    : DEFAULT_APPEARANCE_PRESET;
}
