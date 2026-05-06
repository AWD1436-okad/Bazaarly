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
    description: "Dark navy panels with bright blue-green market accents.",
  },
  {
    value: "soft-light",
    label: "Soft Light",
    description: "Clean bright cards, gentle blue accents, and extra calm spacing.",
  },
  {
    value: "clean-compact",
    label: "Clean Compact",
    description: "Tighter spacing for power users who want denser management screens.",
  },
] as const;

export type AppearancePreset = (typeof APPEARANCE_PRESETS)[number]["value"];

export const DEFAULT_APPEARANCE_PRESET: AppearancePreset = "current-tradex";

export function normalizeAppearancePreset(value?: string | null): AppearancePreset {
  return APPEARANCE_PRESETS.some((preset) => preset.value === value)
    ? (value as AppearancePreset)
    : DEFAULT_APPEARANCE_PRESET;
}
