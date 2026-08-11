export const PLAYER_MODE_VALUES = ["LITTLE", "JUNIOR", "YOUNG", "ADVANCED"] as const;

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
  showDetailedHelpers: boolean;
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
  moneyLabels: {
    balance: string;
    todayNet: string;
    totalNet: string;
    balanceHelper: string;
    todayNetHelper: string;
    totalNetHelper: string;
  };
};

export const PLAYER_MODE_CONFIGS: Record<PlayerMode, PlayerModeConfig> = {
  LITTLE: {
    value: "LITTLE",
    label: "Little Players",
    shortLabel: "Little",
    ageLabel: "Ages 3-5",
    signupDescription: "Big buttons, pictures, and super easy steps.",
    settingsDescription: "Big buttons. Easy steps.",
    dashboardTitle: "Your game home",
    dashboardLead: "",
    challengeLead: "Tiny tasks with big progress.",
    bodyClass: "player-mode-little",
    showAdvancedControls: false,
    showDetailedHelpers: false,
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
    moneyLabels: {
      balance: "Money you can spend",
      todayNet: "Money earned today",
      totalNet: "Money earned since you started",
      balanceHelper: "",
      todayNetHelper: "",
      totalNetHelper: "",
    },
  },
  JUNIOR: {
    value: "JUNIOR",
    label: "Junior Players",
    shortLabel: "Junior",
    ageLabel: "Ages 6-8",
    signupDescription: "Simple reading, clear buttons, and fun tasks.",
    settingsDescription: "Simple words and clear buttons.",
    dashboardTitle: "Your shop home",
    dashboardLead: "Keep your shop growing.",
    challengeLead: "Clear business tasks with simple words and steady progress.",
    bodyClass: "player-mode-junior",
    showAdvancedControls: false,
    showDetailedHelpers: false,
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
    moneyLabels: {
      balance: "Money you can spend",
      todayNet: "Today's profit",
      totalNet: "Total profit",
      balanceHelper: "",
      todayNetHelper: "Sales money minus item costs.",
      totalNetHelper: "",
    },
  },
  YOUNG: {
    value: "YOUNG",
    label: "Young Players",
    shortLabel: "Young",
    ageLabel: "Ages 9-13",
    signupDescription: "A clear shop game with easier tips and simpler controls.",
    settingsDescription: "Clear shop controls.",
    dashboardTitle: "Shop home base",
    dashboardLead: "Keep your shop growing.",
    challengeLead: "Shop challenges with clear goals and helpful progress.",
    bodyClass: "player-mode-young",
    showAdvancedControls: true,
    showDetailedHelpers: false,
    useBigButtons: false,
    useShortText: true,
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
    moneyLabels: {
      balance: "Money you can spend",
      todayNet: "Today profit",
      totalNet: "Total profit",
      balanceHelper: "",
      todayNetHelper: "Sales minus sold-item costs.",
      totalNetHelper: "",
    },
  },
  ADVANCED: {
    value: "ADVANCED",
    label: "Advanced Players",
    shortLabel: "Advanced",
    ageLabel: "Ages 14+",
    signupDescription: "Full shop game with more details and harder choices.",
    settingsDescription: "Full shop controls.",
    dashboardTitle: "Business home base",
    dashboardLead: "Keep your shop growing.",
    challengeLead: "Full business challenges that scale with shop size.",
    bodyClass: "player-mode-advanced",
    showAdvancedControls: true,
    showDetailedHelpers: true,
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
    moneyLabels: {
      balance: "Balance",
      todayNet: "Today Profit",
      totalNet: "Total Profit",
      balanceHelper: "Money you can spend.",
      todayNetHelper: "Sales revenue minus sold-item cost.",
      totalNetHelper: "All sales revenue minus sold-item cost.",
    },
  },
};

export const PLAYER_MODE_OPTIONS = PLAYER_MODE_VALUES.map((value) => PLAYER_MODE_CONFIGS[value]);

export function normalizePlayerMode(value: unknown): PlayerMode {
  void value;
  return "ADVANCED";
}

export function getPlayerModeConfig(value: unknown) {
  return PLAYER_MODE_CONFIGS[normalizePlayerMode(value)];
}

export function getPlayerModeProfitChallengeLabel(value: unknown, amountLabel: string) {
  const playerMode = normalizePlayerMode(value);

  if (playerMode === "LITTLE") {
    return `Earn ${amountLabel}`;
  }

  if (playerMode === "JUNIOR") {
    return `Make ${amountLabel} profit after item costs`;
  }

  if (playerMode === "YOUNG") {
    return `Make ${amountLabel} profit after sold-item costs`;
  }

  return `Earn ${amountLabel} net profit`;
}
