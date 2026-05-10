export const PLAYER_MODE_VALUES = ["LITTLE", "JUNIOR", "TEEN"] as const;

export type PlayerMode = (typeof PLAYER_MODE_VALUES)[number];

export type PlayerModeConfig = {
  value: PlayerMode;
  label: string;
  shortLabel: string;
  ageLabel: string;
  signupDescription: string;
  settingsDescription: string;
  dashboardTitle: string;
  dashboardLead: string;
  challengeLead: string;
  bodyClass: string;
  showAdvancedControls: boolean;
  useBigButtons: boolean;
  useShortText: boolean;
  enableDragHints: boolean;
  navLabels: {
    dashboard: string;
    marketplace: string;
    supplier: string;
    challenges: string;
    orders: string;
    cart: string;
    settings: string;
  };
};

export const PLAYER_MODE_CONFIGS: Record<PlayerMode, PlayerModeConfig> = {
  LITTLE: {
    value: "LITTLE",
    label: "Little Players",
    shortLabel: "Little",
    ageLabel: "Ages 3-5",
    signupDescription: "Big buttons, pictures, and easy steps.",
    settingsDescription: "Big icons, very short words, and guided actions.",
    dashboardTitle: "Your game home",
    dashboardLead: "Tap a big card to buy, sell, check your shop, or try a challenge.",
    challengeLead: "Small picture-friendly tasks with simple progress.",
    bodyClass: "player-mode-little",
    showAdvancedControls: false,
    useBigButtons: true,
    useShortText: true,
    enableDragHints: false,
    navLabels: {
      dashboard: "Home",
      marketplace: "Buy",
      supplier: "Stock",
      challenges: "Tasks",
      orders: "Sales",
      cart: "Cart",
      settings: "More",
    },
  },
  JUNIOR: {
    value: "JUNIOR",
    label: "Junior Players",
    shortLabel: "Junior",
    ageLabel: "Ages 6-8",
    signupDescription: "Simple reading, clear buttons, and fun tasks.",
    settingsDescription: "Clear instructions, friendly cards, and easier shop words.",
    dashboardTitle: "Your shop home",
    dashboardLead: "Buy stock, sell items, complete tasks, and keep your shop moving.",
    challengeLead: "Clear business tasks with simple words and steady progress.",
    bodyClass: "player-mode-junior",
    showAdvancedControls: false,
    useBigButtons: true,
    useShortText: true,
    enableDragHints: false,
    navLabels: {
      dashboard: "Home",
      marketplace: "Market",
      supplier: "Buy Stock",
      challenges: "Tasks",
      orders: "Sales",
      cart: "Cart",
      settings: "More",
    },
  },
  TEEN: {
    value: "TEEN",
    label: "Teen Players",
    shortLabel: "Teen",
    ageLabel: "Ages 9-15",
    signupDescription: "Full shop game with harder challenges.",
    settingsDescription: "Full shop controls, pricing tools, restocking, and harder challenges.",
    dashboardTitle: "Business home base",
    dashboardLead: "Track profit, restock smarter, manage listings, and grow your shop.",
    challengeLead: "Full business challenges that scale with shop size.",
    bodyClass: "player-mode-teen",
    showAdvancedControls: true,
    useBigButtons: false,
    useShortText: false,
    enableDragHints: false,
    navLabels: {
      dashboard: "Home",
      marketplace: "Market",
      supplier: "Buy Stock",
      challenges: "Challenges",
      orders: "Orders",
      cart: "Cart",
      settings: "More",
    },
  },
};

export const PLAYER_MODE_OPTIONS = PLAYER_MODE_VALUES.map((value) => PLAYER_MODE_CONFIGS[value]);

export function normalizePlayerMode(value: unknown): PlayerMode {
  return PLAYER_MODE_VALUES.includes(value as PlayerMode) ? (value as PlayerMode) : "TEEN";
}

export function getPlayerModeConfig(value: unknown) {
  return PLAYER_MODE_CONFIGS[normalizePlayerMode(value)];
}
