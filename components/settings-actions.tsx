"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { HoldToShowInput } from "@/components/hold-to-show-input";
import type { PlayerMode, PlayerModeConfig } from "@/lib/player-mode";

type SettingsActionsProps = {
  email: string | null;
  username: string;
  displayName: string;
  currentShopName: string | null;
  canRenameStore: boolean;
  currentCurrencyCode: string;
  currentAppearancePreset: string;
  currentPlayerMode: PlayerMode;
  maskedBankNumber: string;
  renameStoreCostLabel: string;
  autoRestockSubscription: {
    plan: "SIMPLE" | "PRO" | "MAX";
    status: "ACTIVE" | "CANCELLED";
    planName: string;
    dailyCostCents: number;
    dailyCostLabel: string;
    restockIntervalMinutes: number;
    nextChargeAt: string;
    nextRestockAt: string | null;
    cycleLabel: string;
    coverageLabel: string;
    lastRestockAt: string | null;
    lastChargedAt: string | null;
    fullAccessEnabled: boolean;
  } | null;
  autoRestockPlanLabels: {
    simple: string;
    pro: string;
    max: string;
  };
  fullAccessCostLabel: string;
  playerModeOptions: ReadonlyArray<PlayerModeConfig>;
  appearancePresets: ReadonlyArray<{
    value: string;
    label: string;
    description: string;
  }>;
  priceProfiles: Array<{
    currencyCode: string;
    label: string;
    regionName: string;
    currencyName: string;
    countryName: string;
    symbol: string;
    searchTerms?: string[];
  }>;
};

type ActionState = {
  message: string | null;
  error: string | null;
};

const initialState: ActionState = {
  message: null,
  error: null,
};

function formatCountdown(ms: number) {
  const clampedSeconds = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(clampedSeconds / 86_400);
  const hours = Math.floor((clampedSeconds % 86_400) / 3_600);
  const minutes = Math.floor(clampedSeconds / 60);
  const seconds = clampedSeconds % 60;
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${String(Math.floor((clampedSeconds % 3_600) / 60)).padStart(2, "0")}m`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const RESTOCK_INTERVAL_LIMITS: Record<
  "SIMPLE" | "PRO" | "MAX",
  { min: number; max: number; defaultValue: number; customizable: boolean }
> = {
  SIMPLE: { min: 5, max: 5, defaultValue: 5, customizable: false },
  PRO: { min: 2, max: 10, defaultValue: 5, customizable: true },
  MAX: { min: 1, max: 20, defaultValue: 3, customizable: true },
};

function clampRestockInterval(plan: "SIMPLE" | "PRO" | "MAX", value: number) {
  const limits = RESTOCK_INTERVAL_LIMITS[plan];
  if (!limits.customizable) {
    return limits.defaultValue;
  }

  return Math.min(limits.max, Math.max(limits.min, Math.round(value || limits.defaultValue)));
}

export function SettingsActions({
  email,
  username,
  displayName,
  currentShopName,
  canRenameStore,
  currentCurrencyCode,
  currentAppearancePreset,
  currentPlayerMode,
  maskedBankNumber,
  renameStoreCostLabel,
  autoRestockSubscription,
  autoRestockPlanLabels,
  fullAccessCostLabel,
  playerModeOptions,
  appearancePresets,
  priceProfiles,
}: SettingsActionsProps) {
  const router = useRouter();
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [displayNameOpen, setDisplayNameOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [pinResetOpen, setPinResetOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [fullAccessOpen, setFullAccessOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"SIMPLE" | "PRO" | "MAX">(
    autoRestockSubscription?.plan ?? "SIMPLE",
  );
  const [selectedRestockInterval, setSelectedRestockInterval] = useState(
    autoRestockSubscription?.restockIntervalMinutes ??
      RESTOCK_INTERVAL_LIMITS[autoRestockSubscription?.plan ?? "SIMPLE"].defaultValue,
  );
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [nextUsername, setNextUsername] = useState(username);
  const [usernamePassword, setUsernamePassword] = useState("");
  const [nextDisplayName, setNextDisplayName] = useState(displayName);
  const [displayNamePassword, setDisplayNamePassword] = useState("");
  const [renameName, setRenameName] = useState(currentShopName ?? "");
  const [renamePassword, setRenamePassword] = useState("");
  const [bankPassword, setBankPassword] = useState("");
  const [bankPin, setBankPin] = useState("");
  const [revealedBankNumber, setRevealedBankNumber] = useState<string | null>(null);
  const [pinResetPassword, setPinResetPassword] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [confirmNextPin, setConfirmNextPin] = useState("");
  const [logoutPassword, setLogoutPassword] = useState("");
  const [deleteUsername, setDeleteUsername] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [fullAccessPassword, setFullAccessPassword] = useState("");
  const [fullAccessPin, setFullAccessPin] = useState("");
  const [currencyCode, setCurrencyCode] = useState(currentCurrencyCode);
  const [appearancePreset, setAppearancePreset] = useState(currentAppearancePreset);
  const [playerMode, setPlayerMode] = useState<PlayerMode>(currentPlayerMode);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [restockStatusMessage, setRestockStatusMessage] = useState<string | null>(null);
  const lastRestockProbeAt = useRef(0);
  const currentCurrencyProfile = priceProfiles.find((profile) => profile.currencyCode === currentCurrencyCode);
  const initialCurrencySearch = currentCurrencyProfile
    ? `${currentCurrencyProfile.currencyCode} - ${currentCurrencyProfile.currencyName}`
    : currentCurrencyCode;
  const [currencySearch, setCurrencySearch] = useState(initialCurrencySearch);
  const [submitting, setSubmitting] = useState<
    | null
    | "username"
    | "displayName"
    | "rename"
    | "bank"
    | "pinReset"
    | "logout"
    | "delete"
    | "currency"
    | "appearance"
    | "playerMode"
    | "autoRestock"
    | "restockInterval"
    | "fullAccess"
  >(null);
  const [state, setState] = useState<ActionState>(initialState);
  const selectedCurrencyProfile = priceProfiles.find((profile) => profile.currencyCode === currencyCode);
  const canSubmitDelete =
    deleteConfirmation === "DELETE" &&
    deleteUsername.trim().toLowerCase() === username.toLowerCase() &&
    deletePassword.trim().length > 0;
  const normalizedCurrencySearch = currencySearch.trim().toLowerCase();
  const filteredPriceProfiles = priceProfiles
    .filter((profile) => {
      if (!normalizedCurrencySearch) {
        return profile.currencyCode === currencyCode || profile.currencyCode === currentCurrencyCode;
      }

      const haystack = [
        profile.currencyCode,
        profile.currencyName,
        profile.countryName,
        profile.symbol,
        profile.label,
        profile.regionName,
        ...(profile.searchTerms ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedCurrencySearch);
    })
    .slice(0, 8);
  const activeRestockSubscription = autoRestockSubscription?.status === "ACTIVE" ? autoRestockSubscription : null;
  const selectedPlanMatchesActive =
    Boolean(activeRestockSubscription) && activeRestockSubscription?.plan === selectedPlan;
  const selectedPlanIntervalLimits = RESTOCK_INTERVAL_LIMITS[selectedPlan];
  const activeIntervalIsDirty =
    Boolean(activeRestockSubscription) &&
    selectedPlanMatchesActive &&
    activeRestockSubscription?.restockIntervalMinutes !==
      clampRestockInterval(selectedPlan, selectedRestockInterval);
  const nextRestockTime = activeRestockSubscription?.nextRestockAt
    ? new Date(activeRestockSubscription.nextRestockAt).getTime()
    : null;
  const nextChargeTime = activeRestockSubscription?.nextChargeAt
    ? new Date(activeRestockSubscription.nextChargeAt).getTime()
    : null;
  const restockCountdownLabel = nextRestockTime
    ? nextRestockTime <= clockNow
      ? restockStatusMessage ?? "Checking sold-out items now"
      : `Next check in ${formatCountdown(nextRestockTime - clockNow)}`
    : "Waiting for the next check";
  const renewalCountdownLabel = nextChargeTime
    ? nextChargeTime <= clockNow
      ? "Renewal will be checked shortly"
      : `Renews in ${formatCountdown(nextChargeTime - clockNow)}`
    : "No renewal scheduled";

  useEffect(() => {
    if (!activeRestockSubscription) {
      return;
    }

    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeRestockSubscription]);

  useEffect(() => {
    if (!activeRestockSubscription || !nextRestockTime) {
      return;
    }
    if (nextRestockTime > clockNow) {
      return;
    }
    if (clockNow - lastRestockProbeAt.current < 12_000) {
      return;
    }

    lastRestockProbeAt.current = clockNow;
    void fetch("/api/auto-restock/pending", { cache: "no-store", credentials: "same-origin" })
      .then((response) => response.json() as Promise<{ pending?: unknown; cycleResult?: { message?: string } }>)
      .then((payload) => {
        setRestockStatusMessage(
          payload.pending
            ? "Restock proposal ready"
            : payload.cycleResult?.message
              ? `${payload.cycleResult.message} Next check is resetting.`
              : "No sold-out items found. Next check is resetting.",
        );
        router.refresh();
      })
      .catch(() => {
        setRestockStatusMessage("Restock check will retry shortly");
      });
  }, [activeRestockSubscription, clockNow, nextRestockTime, router]);

  function resetMessages() {
    setState(initialState);
  }

  function closeBankModal() {
    setBankOpen(false);
    setBankPassword("");
    setBankPin("");
    setRevealedBankNumber(null);
  }

  async function handleUsernameChange() {
    setSubmitting("username");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("username", nextUsername);
      formData.set("password", usernamePassword);

      const response = await fetch("/settings/rename-username", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        username?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Username change failed");
      }

      setState({ message: payload.message ?? "Username changed successfully", error: null });
      setNextUsername(payload.username ?? nextUsername);
      setUsernamePassword("");
      setUsernameOpen(false);
      router.refresh();
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Username change failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDisplayNameChange() {
    setSubmitting("displayName");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("displayName", nextDisplayName);
      formData.set("password", displayNamePassword);

      const response = await fetch("/settings/rename-display-name", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        displayName?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Display name change failed");
      }

      setState({ message: payload.message ?? "Display name changed successfully", error: null });
      setNextDisplayName(payload.displayName ?? nextDisplayName);
      setDisplayNamePassword("");
      setDisplayNameOpen(false);
      router.refresh();
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Display name change failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleRename() {
    setSubmitting("rename");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("name", renameName);
      formData.set("password", renamePassword);

      const response = await fetch("/settings/rename-store", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Store rename failed");
      }

      setState({ message: payload.message ?? "Store renamed successfully", error: null });
      setRenamePassword("");
      setRenameOpen(false);
      router.refresh();
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Store rename failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDeleteAccount() {
    setSubmitting("delete");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("username", deleteUsername);
      formData.set("password", deletePassword);
      formData.set("confirmation", deleteConfirmation);

      const response = await fetch("/settings/delete-account", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        redirectTo?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Account deletion failed");
      }

      window.location.assign(payload.redirectTo ?? "/login?deleted=1");
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Account deletion failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleRevealBankNumber() {
    setSubmitting("bank");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("password", bankPassword);
      formData.set("checkoutPin", bankPin);

      const response = await fetch("/settings/reveal-bank-number", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        bankNumber?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.bankNumber) {
        throw new Error(payload.error ?? "Bank number reveal failed");
      }

      setRevealedBankNumber(payload.bankNumber);
      setBankPassword("");
      setBankPin("");
      setState({ message: "Bank number verified", error: null });
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Bank number reveal failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handlePinReset() {
    setSubmitting("pinReset");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("password", pinResetPassword);
      formData.set("newPin", nextPin);
      formData.set("confirmPin", confirmNextPin);

      const response = await fetch("/settings/reset-pin", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string; message?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "PIN reset failed");
      }

      setPinResetOpen(false);
      setPinResetPassword("");
      setNextPin("");
      setConfirmNextPin("");
      setState({ message: payload.message ?? "Bank PIN reset securely", error: null });
      router.refresh();
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "PIN reset failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleLogout() {
    setSubmitting("logout");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("password", logoutPassword);

      const response = await fetch("/auth/logout", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        redirectTo?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Logout failed");
      }

      window.location.assign(payload.redirectTo ?? "/login");
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Logout failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCurrencyChange() {
    setSubmitting("currency");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("currencyCode", currencyCode);

      const response = await fetch("/settings/price-region", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        currencyCode?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Currency update failed");
      }

      setCurrencyCode(payload.currencyCode ?? currencyCode);
      setState({ message: payload.message ?? "Display currency updated", error: null });
      router.refresh();
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Currency update failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleAppearanceChange() {
    setSubmitting("appearance");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("appearancePreset", appearancePreset);

      const response = await fetch("/settings/appearance", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        appearancePreset?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Appearance update failed");
      }

      setAppearancePreset(payload.appearancePreset ?? appearancePreset);
      setState({ message: payload.message ?? "Appearance preset updated", error: null });
      router.refresh();
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Appearance update failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handlePlayerModeChange() {
    setSubmitting("playerMode");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("playerMode", playerMode);

      const response = await fetch("/settings/player-mode", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        playerMode?: PlayerMode;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Player mode update failed");
      }

      setPlayerMode(payload.playerMode ?? playerMode);
      setState({ message: payload.message ?? "Player mode updated", error: null });
      router.refresh();
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Player mode update failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleAutoRestockSubscription(action: "activate" | "cancel") {
    setSubmitting("autoRestock");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("action", action);
      if (action === "activate") {
        formData.set("plan", selectedPlan);
        formData.set("confirmReplace", String(confirmReplace));
        formData.set(
          "restockIntervalMinutes",
          String(clampRestockInterval(selectedPlan, selectedRestockInterval)),
        );
      }

      const response = await fetch("/settings/auto-restock-subscription", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        requiresReplaceConfirmation?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        if (payload.requiresReplaceConfirmation) {
          setState({
            message: null,
            error: payload.error ?? "Confirm replacement to switch plans",
          });
          setConfirmReplace(true);
          return;
        }
        throw new Error(payload.error ?? "Auto Restock update failed");
      }

      setConfirmReplace(false);
      setState({ message: payload.message ?? "Auto Restock subscription updated", error: null });
      router.refresh();
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Auto Restock update failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleRestockIntervalUpdate() {
    if (!activeRestockSubscription || !selectedPlanMatchesActive) {
      return;
    }

    setSubmitting("restockInterval");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("action", "updateInterval");
      formData.set("plan", selectedPlan);
      formData.set(
        "restockIntervalMinutes",
        String(clampRestockInterval(selectedPlan, selectedRestockInterval)),
      );

      const response = await fetch("/settings/auto-restock-subscription", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        restockIntervalMinutes?: number;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Restock interval update failed");
      }

      setSelectedRestockInterval(
        payload.restockIntervalMinutes ?? clampRestockInterval(selectedPlan, selectedRestockInterval),
      );
      setState({ message: payload.message ?? "Restock interval updated", error: null });
      router.refresh();
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Restock interval update failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleFullAccessUpdate(enabled: boolean) {
    setSubmitting("fullAccess");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("enabled", String(enabled));
      if (enabled) {
        formData.set("password", fullAccessPassword);
        formData.set("checkoutPin", fullAccessPin);
      }

      const response = await fetch("/settings/auto-restock-full-access", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Full Access update failed");
      }

      setFullAccessOpen(false);
      setFullAccessPassword("");
      setFullAccessPin("");
      setState({ message: payload.message ?? "Full Access updated", error: null });
      router.refresh();
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Full Access update failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className={`settings-actions settings-actions--${currentPlayerMode.toLowerCase()}`}>
      {state.message ? (
        <div className="status-banner status-banner--success">
          <div>
            <h3>{state.message}</h3>
          </div>
        </div>
      ) : null}

      {state.error ? (
        <div className="status-banner status-banner--error">
          <div>
            <h3>Action blocked</h3>
            <p>{state.error}</p>
          </div>
        </div>
      ) : null}

      <div className="settings-layout">
        {currentPlayerMode === "LITTLE" ? (
          <section className="card settings-card settings-section settings-section--little-simple settings-section--wide">
            <div className="settings-section__header">
              <span className="settings-section__eyebrow">Grown-up settings</span>
              <h2>Need more?</h2>
            </div>
            <p className="muted">Password, bank, shop, restocker, and delete tools are lower on this page.</p>
          </section>
        ) : null}
        <section className="card settings-card settings-section">
          <div className="settings-section__header">
            <span className="settings-section__eyebrow">{currentPlayerMode === "LITTLE" ? "Player" : "Player"}</span>
            <h2>{currentPlayerMode === "LITTLE" ? "Me" : "Player details"}</h2>
          </div>
          <div className="settings-list">
            <div className="settings-row">
              <div>
                <strong>Email</strong>
                <p className="muted">{email?.trim() ? email : "No email connected"}</p>
              </div>
            </div>
            <div className="settings-row">
              <div>
                <strong>{currentPlayerMode === "LITTLE" ? "Name" : "Display name"}</strong>
                <p className="muted">{displayName}</p>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  resetMessages();
                  setNextDisplayName(displayName);
                  setDisplayNamePassword("");
                  setDisplayNameOpen(true);
                }}
                disabled={submitting !== null}
              >
                Rename
              </button>
            </div>
            <div className="settings-row">
              <div>
                <strong>{currentPlayerMode === "LITTLE" ? "Handle" : "Username"}</strong>
                <p className="muted">@{username}</p>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  resetMessages();
                  setNextUsername(username);
                  setUsernamePassword("");
                  setUsernameOpen(true);
                }}
                disabled={submitting !== null}
              >
                Rename
              </button>
            </div>
            <div className="settings-row">
              <div>
                <strong>Logout</strong>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  resetMessages();
                  setLogoutPassword("");
                  setLogoutOpen(true);
                }}
                disabled={submitting !== null}
              >
                Logout
              </button>
            </div>
            <div className="settings-row">
              <div>
                <strong>Password</strong>
                <p className="muted">Protected</p>
              </div>
              <a href="/forgot-password" className="ghost-button">
                Reset Password
              </a>
            </div>
          </div>
        </section>

        <section className="card settings-card settings-section settings-card--grownup">
          <div className="settings-section__header">
            <span className="settings-section__eyebrow">Shop</span>
            <h2>{currentPlayerMode === "LITTLE" ? "My Shop" : "Store profile"}</h2>
            <p>Rename cost: {renameStoreCostLabel}.</p>
          </div>
          <div className="settings-list">
            <div className="settings-row">
              <div>
                <strong>Store name</strong>
                {canRenameStore ? (
                  <p className="muted">{currentShopName}</p>
                ) : (
                  <p className="muted">Create a shop before renaming it.</p>
                )}
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  resetMessages();
                  setRenameOpen(true);
                }}
                disabled={!canRenameStore || submitting !== null}
              >
                Rename store
              </button>
            </div>
          </div>
        </section>

        <section className="card settings-card settings-section settings-card--grownup">
          <div className="settings-section__header">
            <span className="settings-section__eyebrow">Security</span>
            <h2>{currentPlayerMode === "LITTLE" ? "Safe Details" : "Bank and security"}</h2>
          </div>
          <div className="settings-list">
            <div className="settings-row">
              <div>
                <strong>Bank number</strong>
                <p className="muted">Stored value: {maskedBankNumber}</p>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  resetMessages();
                  setBankPassword("");
                  setBankPin("");
                  setRevealedBankNumber(null);
                  setBankOpen(true);
                }}
                disabled={submitting !== null}
              >
                View Bank Number
              </button>
            </div>
            <div className="settings-row">
              <div>
                <strong>Bank PIN</strong>
                <p className="muted">Protected</p>
              </div>
              <a href="/forgot-pin" className="ghost-button">
                Forgot PIN?
              </a>
            </div>
          </div>
        </section>

        <section className="card settings-card settings-section">
          <div className="settings-section__header">
            <span className="settings-section__eyebrow">Money</span>
            <h2>Currency</h2>
            {currentPlayerMode === "ADVANCED" ? <p>Changes display only. Base values stay in AUD.</p> : null}
          </div>
          <label className="modal-card__field">
            <span>Search currency by code, name, or country</span>
            <input
              value={currencySearch}
              onChange={(event) => {
                const nextSearch = event.target.value;
                const exactProfile = priceProfiles.find((profile) => {
                  const normalized = nextSearch.trim().toLowerCase();
                  return (
                    profile.currencyCode.toLowerCase() === normalized ||
                    profile.currencyName.toLowerCase() === normalized ||
                    profile.countryName.toLowerCase() === normalized
                  );
                });

                setCurrencySearch(nextSearch);
                if (exactProfile) {
                  setCurrencyCode(exactProfile.currencyCode);
                }
                resetMessages();
              }}
              disabled={submitting !== null}
              placeholder="Pakistan, Australian Dollar, USD..."
            />
          </label>
          <div className="currency-results" role="listbox" aria-label="Currency search results">
            {filteredPriceProfiles.length > 0 ? (
              filteredPriceProfiles.map((profile) => (
                <button
                  key={profile.currencyCode}
                  type="button"
                  className={
                    profile.currencyCode === currencyCode
                      ? "currency-option currency-option--selected"
                      : "currency-option"
                  }
                  onClick={() => {
                    setCurrencyCode(profile.currencyCode);
                    setCurrencySearch(`${profile.currencyCode} - ${profile.currencyName}`);
                    resetMessages();
                  }}
                  disabled={submitting !== null}
                  role="option"
                  aria-selected={profile.currencyCode === currencyCode}
                >
                  <strong>{profile.currencyCode}</strong>
                  <span>{profile.currencyName}</span>
                  <small>{profile.symbol}</small>
                </button>
              ))
            ) : (
              <p className="muted">No matching currency found. Try a currency code, country, or currency name.</p>
            )}
          </div>
          {selectedCurrencyProfile ? (
            <p className="muted">
              Selected: <strong>{selectedCurrencyProfile.currencyCode}</strong> -{" "}
              {selectedCurrencyProfile.currencyName} - {selectedCurrencyProfile.symbol}.
            </p>
          ) : null}
          {currentPlayerMode === "ADVANCED" ? <p className="muted">Static exchange rates are used for display.</p> : null}
          <div className="settings-section__actions">
            <button
              type="button"
              onClick={() => void handleCurrencyChange()}
              disabled={submitting !== null || currencyCode === currentCurrencyCode}
            >
              {submitting === "currency" ? "Updating..." : "Update Currency"}
            </button>
          </div>
        </section>

        <section className="card settings-card settings-section settings-section--wide">
          <div className="settings-section__header settings-section__header--inline">
            <div>
              <span className="settings-section__eyebrow">{currentPlayerMode === "LITTLE" ? "My Mode" : "Player Mode"}</span>
              <h2>{currentPlayerMode === "LITTLE" ? "Game style" : "Choose your game style"}</h2>
              {currentPlayerMode === "LITTLE" ? null : <p>Same world. Different help level.</p>}
            </div>
            <button
              type="button"
              onClick={() => void handlePlayerModeChange()}
              disabled={submitting !== null || playerMode === currentPlayerMode}
            >
              {submitting === "playerMode" ? "Saving..." : "Save mode"}
            </button>
          </div>
          <div className="player-mode-grid" role="radiogroup" aria-label="Player mode">
            {playerModeOptions.map((mode) => (
              <button
                key={mode.value}
                type="button"
                className={mode.value === playerMode ? "player-mode-card player-mode-card--selected" : "player-mode-card"}
                onClick={() => {
                  setPlayerMode(mode.value);
                  resetMessages();
                }}
                disabled={submitting !== null}
                role="radio"
                aria-checked={mode.value === playerMode}
              >
                <span className="player-mode-card__topline">
                  <strong>{mode.label}</strong>
                  <small>{mode.ageLabel}</small>
                </span>
                <span>{mode.settingsDescription}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card settings-card settings-section settings-section--wide">
          <div className="settings-section__header settings-section__header--inline">
            <div>
              <span className="settings-section__eyebrow">{currentPlayerMode === "LITTLE" ? "Colors" : "Appearance"}</span>
              <h2>{currentPlayerMode === "LITTLE" ? "Colors" : "Theme presets"}</h2>
            </div>
            <button
              type="button"
              onClick={() => void handleAppearanceChange()}
              disabled={submitting !== null || appearancePreset === currentAppearancePreset}
            >
              {submitting === "appearance" ? "Applying..." : "Apply preset"}
            </button>
          </div>
          <div className="appearance-grid" role="radiogroup" aria-label="Appearance preset">
            {appearancePresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={
                  preset.value === appearancePreset
                    ? "appearance-option appearance-option--selected"
                    : "appearance-option"
                }
                onClick={() => {
                  setAppearancePreset(preset.value);
                  resetMessages();
                }}
                disabled={submitting !== null}
                role="radio"
                aria-checked={preset.value === appearancePreset}
              >
                <span className={`appearance-option__swatch appearance-option__swatch--${preset.value}`} />
                <span className="appearance-option__copy">
                  <strong>{preset.label}</strong>
                  <small>{preset.description}</small>
                </span>
                <span className={`appearance-preview appearance-preview--${preset.value}`} aria-hidden="true">
                  <span className="appearance-preview__card">
                    <span className="appearance-preview__line appearance-preview__line--strong" />
                    <span className="appearance-preview__line" />
                    <span className="appearance-preview__controls">
                      <span className="appearance-preview__button" />
                      <span className="appearance-preview__badge" />
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="card settings-card settings-section settings-section--wide">
          <div className="settings-section__header settings-section__header--inline">
            <div>
              <span className="settings-section__eyebrow">Auto Restocker</span>
              <h2>Plan and access</h2>
              <p>Full Access is free. Item costs still come from your balance.</p>
            </div>
            <div className="inline-actions">
              {autoRestockSubscription?.status === "ACTIVE" ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => void handleAutoRestockSubscription("cancel")}
                  disabled={submitting !== null}
                >
                  {submitting === "autoRestock" ? "Cancelling..." : "Cancel"}
                </button>
              ) : null}
              {!selectedPlanMatchesActive ? (
                <button
                  type="button"
                  onClick={() => void handleAutoRestockSubscription("activate")}
                  disabled={submitting !== null}
                >
                  {submitting === "autoRestock"
                    ? "Saving..."
                    : activeRestockSubscription
                      ? "Switch plan"
                      : "Activate plan"}
                </button>
              ) : null}
            </div>
          </div>
          <label className="modal-card__field">
            <span>Plan</span>
            <select
              value={selectedPlan}
              onChange={(event) => {
                const nextPlan = event.target.value as "SIMPLE" | "PRO" | "MAX";
                setSelectedPlan(nextPlan);
                setSelectedRestockInterval(
                  nextPlan === autoRestockSubscription?.plan
                    ? autoRestockSubscription.restockIntervalMinutes
                    : RESTOCK_INTERVAL_LIMITS[nextPlan].defaultValue,
                );
                setConfirmReplace(false);
                resetMessages();
              }}
              disabled={submitting !== null}
            >
              <option value="SIMPLE">Simple - {autoRestockPlanLabels.simple}</option>
              <option value="PRO">Pro - {autoRestockPlanLabels.pro}</option>
              <option value="MAX">Max - {autoRestockPlanLabels.max}</option>
            </select>
          </label>
          {selectedPlanIntervalLimits.customizable ? (
            <div className="restock-interval-control">
              <label className="modal-card__field">
                <span>
                  Restock every {selectedPlanIntervalLimits.min}-{selectedPlanIntervalLimits.max} minutes
                </span>
                <input
                  type="number"
                  min={selectedPlanIntervalLimits.min}
                  max={selectedPlanIntervalLimits.max}
                  step={1}
                  value={selectedRestockInterval}
                  onChange={(event) =>
                    setSelectedRestockInterval(clampRestockInterval(selectedPlan, Number(event.target.value)))
                  }
                  disabled={submitting !== null}
                />
              </label>
              {activeIntervalIsDirty ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => void handleRestockIntervalUpdate()}
                  disabled={submitting !== null}
                >
                  {submitting === "restockInterval" ? "Saving..." : "Save interval"}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="muted">Simple Restocker checks every 5 minutes with no custom timer.</p>
          )}
          {autoRestockSubscription?.status === "ACTIVE" ? (
            <div className="settings-restocker-grid">
              <div className="auto-restock-timer">
                <span className="auto-restock-timer__label">Next cycle</span>
                <strong>{restockCountdownLabel}</strong>
                <span>{autoRestockSubscription.cycleLabel}</span>
                <span>{autoRestockSubscription.coverageLabel} per cycle</span>
              </div>
              <div className="settings-list">
                <div className="settings-row settings-row--compact">
                  <span>Current plan</span>
                  <strong>{autoRestockSubscription.planName}</strong>
                </div>
                <div className="settings-row settings-row--compact">
                  <span>48-hour renewal</span>
                  <strong>{autoRestockSubscription.dailyCostLabel}</strong>
                </div>
                <div className="settings-row settings-row--compact">
                  <span>Next renewal</span>
                  <strong>{renewalCountdownLabel}</strong>
                </div>
                <div className="settings-row settings-row--compact">
                  <span>Last restock</span>
                  <strong>
                    {autoRestockSubscription.lastRestockAt
                      ? new Date(autoRestockSubscription.lastRestockAt).toLocaleString()
                      : "Not run yet"}
                  </strong>
                </div>
              </div>
              <div className="status-banner">
                <div>
                  <h3>Full Access is {autoRestockSubscription.fullAccessEnabled ? "on" : "off"}</h3>
                  <p>
                    Allow your Restocker to buy eligible restocks automatically. Item costs are still deducted,
                    and Full Access is free. Item costs still come from your balance.
                  </p>
                </div>
                {autoRestockSubscription.fullAccessEnabled ? (
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={submitting !== null}
                    onClick={() => void handleFullAccessUpdate(false)}
                  >
                    {submitting === "fullAccess" ? "Turning off..." : "Turn off"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={submitting !== null}
                    onClick={() => {
                      resetMessages();
                      setFullAccessPassword("");
                      setFullAccessPin("");
                      setFullAccessOpen(true);
                    }}
                  >
                    Enable Full Access
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="muted">No active Auto Restock subscription.</p>
          )}
          {confirmReplace ? (
            <p className="status-text status-text--error">
              Confirmed replacement is enabled. Activating now will replace your current active plan.
            </p>
          ) : null}
          <p className="muted">Renews every 48 hours.</p>
        </section>

        <section className="card settings-card settings-section settings-section--danger settings-section--wide">
          <div className="settings-section__header settings-section__header--inline">
            <div>
              <span className="settings-section__eyebrow">Danger Zone</span>
              <h2>Delete account</h2>
              <p>This deactivates your account, hides your shop, and signs you out.</p>
            </div>
            <button
              type="button"
              className="danger-button"
              onClick={() => {
                resetMessages();
                setDeleteOpen(true);
              }}
              disabled={submitting !== null}
            >
              Delete Account
            </button>
          </div>
          <p className="muted">
            Order history stays available for marketplace integrity, but your account can no longer be used.
          </p>
        </section>
      </div>

      {usernameOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setUsernameOpen(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-username-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h3 id="change-username-title">Change Username</h3>
              <p>Use 3-24 letters, numbers, underscores, or hyphens.</p>
            </div>
            <label className="modal-card__field">
              New username
              <input
                value={nextUsername}
                onChange={(event) => setNextUsername(event.target.value)}
                autoComplete="username"
                disabled={submitting !== null}
              />
            </label>
            <label className="modal-card__field">
              Password
              <HoldToShowInput
                value={usernamePassword}
                onChange={(event) => setUsernamePassword(event.target.value)}
                autoComplete="current-password"
                disabled={submitting !== null}
              />
            </label>
            {state.error ? <span className="status-text status-text--error">{state.error}</span> : null}
            <div className="modal-card__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setUsernameOpen(false)}
                disabled={submitting !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleUsernameChange()}
                disabled={submitting !== null || nextUsername.trim().length < 3 || usernamePassword.trim().length === 0}
              >
                {submitting === "username" ? "Changing..." : "Change Username"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {displayNameOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setDisplayNameOpen(false)}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-display-name-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h3 id="change-display-name-title">Change Display Name</h3>
              <p>Enter the name people should see across Profit Planet.</p>
            </div>
            <label className="modal-card__field">
              New display name
              <input
                value={nextDisplayName}
                onChange={(event) => setNextDisplayName(event.target.value)}
                autoComplete="name"
                disabled={submitting !== null}
              />
            </label>
            <label className="modal-card__field">
              Password
              <HoldToShowInput
                value={displayNamePassword}
                onChange={(event) => setDisplayNamePassword(event.target.value)}
                autoComplete="current-password"
                disabled={submitting !== null}
              />
            </label>
            {state.error ? <span className="status-text status-text--error">{state.error}</span> : null}
            <div className="modal-card__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setDisplayNameOpen(false)}
                disabled={submitting !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDisplayNameChange()}
                disabled={submitting !== null || nextDisplayName.trim().length < 2 || displayNamePassword.trim().length === 0}
              >
                {submitting === "displayName" ? "Changing..." : "Change Display Name"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {renameOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setRenameOpen(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-store-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h3 id="rename-store-title">Rename Store</h3>
              <p>Enter a new unique store name and your password. The charge is exactly {renameStoreCostLabel}.</p>
            </div>
            <label className="modal-card__field">
              New store name
              <input
                value={renameName}
                onChange={(event) => setRenameName(event.target.value)}
                disabled={submitting !== null}
              />
            </label>
            <label className="modal-card__field">
              Password
              <HoldToShowInput
                value={renamePassword}
                onChange={(event) => setRenamePassword(event.target.value)}
                autoComplete="current-password"
                disabled={submitting !== null}
              />
            </label>
            {state.error ? <span className="status-text status-text--error">{state.error}</span> : null}
            <div className="modal-card__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setRenameOpen(false)}
                disabled={submitting !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleRename()}
                disabled={submitting !== null || renameName.trim().length < 2 || renamePassword.trim().length === 0}
              >
                {submitting === "rename" ? "Renaming..." : `Pay ${renameStoreCostLabel} and rename`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bankOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeBankModal}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bank-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            {revealedBankNumber ? (
              <>
                <div className="modal-card__copy">
                  <h3 id="bank-details-title">Your Bank Number</h3>
                  <p>Save this number securely. You will need it for transactions.</p>
                </div>
                <div className="security-result-card">
                  <strong className="security-result-card__value">{revealedBankNumber}</strong>
                </div>
                <div className="modal-card__actions">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => {
                      void navigator.clipboard.writeText(revealedBankNumber);
                      setState({ message: "Bank number copied", error: null });
                    }}
                    disabled={submitting !== null}
                  >
                    Copy
                  </button>
                  <button type="button" onClick={closeBankModal} disabled={submitting !== null}>
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-card__copy">
                  <h3 id="bank-details-title">View Bank Number</h3>
                  <p>Enter your password and checkout PIN to reveal your bank number.</p>
                </div>
                <label className="modal-card__field">
                  Password
                  <HoldToShowInput
                    value={bankPassword}
                    onChange={(event) => setBankPassword(event.target.value)}
                    autoComplete="current-password"
                    disabled={submitting !== null}
                  />
                </label>
                <label className="modal-card__field">
                  Checkout PIN
                  <HoldToShowInput
                    value={bankPin}
                    onChange={(event) => setBankPin(event.target.value)}
                    inputMode="numeric"
                    autoComplete="off"
                    disabled={submitting !== null}
                  />
                </label>
                {state.error ? <span className="status-text status-text--error">{state.error}</span> : null}
                <div className="modal-card__actions">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={closeBankModal}
                    disabled={submitting !== null}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRevealBankNumber()}
                    disabled={submitting !== null || bankPassword.trim().length === 0 || bankPin.trim().length === 0}
                  >
                    {submitting === "bank" ? "Verifying..." : "Reveal Bank Number"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {pinResetOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => {
            setPinResetOpen(false);
            setPinResetPassword("");
            setNextPin("");
            setConfirmNextPin("");
          }}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pin-reset-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h3 id="pin-reset-title">Reset Bank PIN</h3>
              <p>For security, we canâ€™t show your old PIN. Confirm your password and create a new one.</p>
            </div>
            <label className="modal-card__field">
              Password
              <HoldToShowInput
                value={pinResetPassword}
                onChange={(event) => setPinResetPassword(event.target.value)}
                autoComplete="current-password"
                disabled={submitting !== null}
              />
            </label>
            <label className="modal-card__field">
              New bank PIN
              <HoldToShowInput
                value={nextPin}
                onChange={(event) => setNextPin(event.target.value)}
                inputMode="numeric"
                autoComplete="off"
                disabled={submitting !== null}
              />
            </label>
            <label className="modal-card__field">
              Confirm new PIN
              <HoldToShowInput
                value={confirmNextPin}
                onChange={(event) => setConfirmNextPin(event.target.value)}
                inputMode="numeric"
                autoComplete="off"
                disabled={submitting !== null}
              />
            </label>
            {state.error ? <span className="status-text status-text--error">{state.error}</span> : null}
            <div className="modal-card__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setPinResetOpen(false);
                  setPinResetPassword("");
                  setNextPin("");
                  setConfirmNextPin("");
                }}
                disabled={submitting !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handlePinReset()}
                disabled={
                  submitting !== null ||
                  pinResetPassword.trim().length === 0 ||
                  nextPin.trim().length === 0 ||
                  confirmNextPin.trim().length === 0
                }
              >
                {submitting === "pinReset" ? "Resetting..." : "Reset Bank PIN"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {logoutOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setLogoutOpen(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h3 id="logout-title">Confirm Logout</h3>
              <p>Enter your password to confirm logout.</p>
            </div>
            <label className="modal-card__field">
              Password
              <HoldToShowInput
                value={logoutPassword}
                onChange={(event) => setLogoutPassword(event.target.value)}
                autoComplete="current-password"
                disabled={submitting !== null}
              />
            </label>
            {state.error ? <span className="status-text status-text--error">{state.error}</span> : null}
            <div className="modal-card__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setLogoutOpen(false)}
                disabled={submitting !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={submitting !== null || logoutPassword.trim().length === 0}
              >
                {submitting === "logout" ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {fullAccessOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setFullAccessOpen(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="full-access-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h3 id="full-access-title">Enable Full Access</h3>
              <p>
                Full Access is free. Your Restocker can buy automatically, but item costs still
                come from your balance.
              </p>
            </div>
            <label className="modal-card__field">
              Password
              <HoldToShowInput
                value={fullAccessPassword}
                onChange={(event) => setFullAccessPassword(event.target.value)}
                autoComplete="current-password"
                disabled={submitting !== null}
              />
            </label>
            <label className="modal-card__field">
              Checkout PIN
              <HoldToShowInput
                value={fullAccessPin}
                onChange={(event) => setFullAccessPin(event.target.value)}
                inputMode="numeric"
                autoComplete="off"
                disabled={submitting !== null}
              />
            </label>
            {state.error ? <span className="status-text status-text--error">{state.error}</span> : null}
            <div className="modal-card__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setFullAccessOpen(false)}
                disabled={submitting !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleFullAccessUpdate(true)}
                disabled={
                  submitting !== null ||
                  fullAccessPassword.trim().length === 0 ||
                  fullAccessPin.trim().length === 0
                }
              >
                {submitting === "fullAccess" ? "Enabling..." : "Enable Full Access"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setDeleteOpen(false)}>
          <div
            className="modal-card modal-card--danger"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h3 id="delete-account-title">Delete Account</h3>
              <p>
                This cannot be undone. Your shop and listings will be deactivated, active carts
                will be abandoned, and you will be signed out.
              </p>
              <p className="muted">
                This action removes your access and disables selling data visibility for your account.
                Historical marketplace order records are kept for transaction integrity.
              </p>
            </div>
            <label className="modal-card__field">
              Username
              <input
                value={deleteUsername}
                onChange={(event) => setDeleteUsername(event.target.value)}
                placeholder={username}
                autoComplete="username"
                disabled={submitting !== null}
              />
            </label>
            <label className="modal-card__field">
              Password
              <HoldToShowInput
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                autoComplete="current-password"
                disabled={submitting !== null}
              />
            </label>
            <label className="modal-card__field">
              Type DELETE
              <input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                disabled={submitting !== null}
              />
            </label>
            {state.error ? <span className="status-text status-text--error">{state.error}</span> : null}
            <div className="modal-card__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setDeleteOpen(false)}
                disabled={submitting !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => void handleDeleteAccount()}
                disabled={submitting !== null || !canSubmitDelete}
              >
                {submitting === "delete" ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
