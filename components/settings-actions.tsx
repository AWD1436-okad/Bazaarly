"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SettingsActionsProps = {
  username: string;
  displayName: string;
  currentShopName: string | null;
  canRenameStore: boolean;
  currentCurrencyCode: string;
  maskedBankNumber: string;
  renameStoreCostLabel: string;
  autoRestockEnabled: boolean;
  autoRestockQuantity: number;
  autoRestockLastRunAt: string | null;
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

export function SettingsActions({
  username,
  displayName,
  currentShopName,
  canRenameStore,
  currentCurrencyCode,
  maskedBankNumber,
  renameStoreCostLabel,
  autoRestockEnabled,
  autoRestockQuantity,
  autoRestockLastRunAt,
  priceProfiles,
}: SettingsActionsProps) {
  const router = useRouter();
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [displayNameOpen, setDisplayNameOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restockEnabled, setRestockEnabled] = useState(autoRestockEnabled);
  const [restockQuantity, setRestockQuantity] = useState(
    Math.min(5, Math.max(1, autoRestockQuantity)),
  );
  const [nextUsername, setNextUsername] = useState(username);
  const [usernamePassword, setUsernamePassword] = useState("");
  const [nextDisplayName, setNextDisplayName] = useState(displayName);
  const [displayNamePassword, setDisplayNamePassword] = useState("");
  const [renameName, setRenameName] = useState(currentShopName ?? "");
  const [renamePassword, setRenamePassword] = useState("");
  const [bankPassword, setBankPassword] = useState("");
  const [bankPin, setBankPin] = useState("");
  const [revealedBankNumber, setRevealedBankNumber] = useState<string | null>(null);
  const [logoutPassword, setLogoutPassword] = useState("");
  const [deleteUsername, setDeleteUsername] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [currencyCode, setCurrencyCode] = useState(currentCurrencyCode);
  const currentCurrencyProfile = priceProfiles.find((profile) => profile.currencyCode === currentCurrencyCode);
  const initialCurrencySearch = currentCurrencyProfile
    ? `${currentCurrencyProfile.currencyCode} - ${currentCurrencyProfile.currencyName}`
    : currentCurrencyCode;
  const [currencySearch, setCurrencySearch] = useState(initialCurrencySearch);
  const [submitting, setSubmitting] = useState<
    null | "username" | "displayName" | "rename" | "bank" | "logout" | "delete" | "currency" | "autoRestock"
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

  async function handleAutoRestockChange() {
    setSubmitting("autoRestock");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("enabled", String(restockEnabled));
      formData.set("quantity", String(restockQuantity));

      const response = await fetch("/settings/auto-restock", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        enabled?: boolean;
        quantity?: number;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Auto Restock update failed");
      }

      setRestockEnabled(Boolean(payload.enabled));
      setRestockQuantity(Math.min(5, Math.max(1, Number(payload.quantity ?? restockQuantity))));
      setState({ message: payload.message ?? "Auto Restock updated", error: null });
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

  return (
    <div className="settings-actions">
      {state.message ? (
        <div className="status-banner status-banner--success">
          <div>
            <h3>{state.message}</h3>
            <p>Your account settings have been updated.</p>
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

      <section className="card settings-card">
        <div className="card-header">
          <div className="card-header__copy">
            <h2>Auto Restock</h2>
            <p>Automatically restock your sold-out listed items from supplier stock.</p>
          </div>
          <button
            type="button"
            onClick={() => void handleAutoRestockChange()}
            disabled={submitting !== null}
          >
            {submitting === "autoRestock" ? "Saving..." : "Save Auto Restock"}
          </button>
        </div>
        <label className="modal-card__field">
          <span>Auto Restock sold-out items</span>
          <select
            value={restockEnabled ? "on" : "off"}
            onChange={(event) => {
              setRestockEnabled(event.target.value === "on");
              resetMessages();
            }}
            disabled={submitting !== null}
          >
            <option value="off">Off</option>
            <option value="on">On</option>
          </select>
        </label>
        <label className="modal-card__field">
          <span>Quantity per sold-out item</span>
          <select
            value={String(restockQuantity)}
            onChange={(event) => {
              setRestockQuantity(Math.min(5, Math.max(1, Number(event.target.value) || 1)));
              resetMessages();
            }}
            disabled={submitting !== null}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </label>
        <p className="muted">
          Status: <strong>{restockEnabled ? "On" : "Off"}</strong> | Quantity:{" "}
          <strong>{restockQuantity}</strong>
        </p>
        <p className="muted">
          Last auto-restock run:{" "}
          {autoRestockLastRunAt ? new Date(autoRestockLastRunAt).toLocaleString() : "Not run yet"}
        </p>
        <p className="muted">
          Safety rules: only your sold-out listed items, quantity 1-5, capped by supplier stock,
          and blocked when your balance is too low.
        </p>
      </section>

      <section className="card settings-card">
        <div className="card-header">
          <div className="card-header__copy">
            <h2>Display Currency</h2>
            <p>
              Prices are stored in a base value. Your selected currency only changes how prices
              appear on your screen. Other users may see the same item in their own currency.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCurrencyChange()}
            disabled={submitting !== null || currencyCode === currentCurrencyCode}
          >
            {submitting === "currency" ? "Updating..." : "Update Currency"}
          </button>
        </div>
        <label>
          Search currency by code, name, or country
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
            placeholder="Pakistan, Australian Dollar, $, USD..."
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
        <p className="muted">
          Current currency: {currentCurrencyCode}. Sellers and buyers can use different display
          currencies, so one listing may appear as PKR to the seller, AUD to one buyer, and USD to
          another buyer while checkout still uses the stored AUD value.
        </p>
        <p className="muted">Exchange rates are static reference values in this build and are not live market feeds.</p>
      </section>

      <section className="card settings-card">
        <div className="card-header">
          <div className="card-header__copy">
            <h2>Bank Details</h2>
            <p>Bank number is masked by default and can be revealed after password and PIN checks.</p>
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
        <p className="muted">
          Bank number is hidden by default for security.
          {" "}
          Stored value: <strong>{maskedBankNumber}</strong>
        </p>
      </section>

      <section className="card settings-card">
        <div className="card-header">
          <div className="card-header__copy">
            <h2>Change Username</h2>
            <p>Update your login handle after password confirmation.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetMessages();
              setNextUsername(username);
              setUsernamePassword("");
              setUsernameOpen(true);
            }}
            disabled={submitting !== null}
          >
            Change Username
          </button>
        </div>
        <p className="muted">Current username: @{username}</p>
      </section>

      <section className="card settings-card">
        <div className="card-header">
          <div className="card-header__copy">
            <h2>Change Display Name</h2>
            <p>Update the name other users see across orders, sales, and account screens.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetMessages();
              setNextDisplayName(displayName);
              setDisplayNamePassword("");
              setDisplayNameOpen(true);
            }}
            disabled={submitting !== null}
          >
            Change Display Name
          </button>
        </div>
        <p className="muted">Current display name: {displayName}</p>
      </section>

      <section className="card settings-card">
        <div className="card-header">
          <div className="card-header__copy">
            <h2>Rename Store</h2>
            <p>Cost: {renameStoreCostLabel}. This updates your public shop name after password confirmation.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetMessages();
              setRenameOpen(true);
            }}
            disabled={!canRenameStore || submitting !== null}
          >
            Rename Store
          </button>
        </div>
        {!canRenameStore ? (
          <p className="muted">Create a shop before renaming it.</p>
        ) : (
          <p className="muted">Current store name: {currentShopName}</p>
        )}
      </section>

      <section className="card settings-card">
        <div className="card-header">
          <div className="card-header__copy">
            <h2>Logout</h2>
            <p>Sign out of this device after confirming your password.</p>
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
        <p className="muted">Easy to find here, but no longer exposed in the main navigation.</p>
      </section>

      <section className="card settings-card settings-card--danger">
        <div className="card-header">
          <div className="card-header__copy">
            <h2>Delete Account</h2>
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
          Order history stays available for marketplace integrity, but your account can no longer
          be used.
        </p>
      </section>

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
              <input
                value={usernamePassword}
                onChange={(event) => setUsernamePassword(event.target.value)}
                type="password"
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
              <p>Enter the name people should see across Tradex.</p>
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
              <input
                value={displayNamePassword}
                onChange={(event) => setDisplayNamePassword(event.target.value)}
                type="password"
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
              <input
                value={renamePassword}
                onChange={(event) => setRenamePassword(event.target.value)}
                type="password"
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
                  <input
                    value={bankPassword}
                    onChange={(event) => setBankPassword(event.target.value)}
                    type="password"
                    autoComplete="current-password"
                    disabled={submitting !== null}
                  />
                </label>
                <label className="modal-card__field">
                  Checkout PIN
                  <input
                    value={bankPin}
                    onChange={(event) => setBankPin(event.target.value)}
                    inputMode="numeric"
                    type="password"
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
              <input
                value={logoutPassword}
                onChange={(event) => setLogoutPassword(event.target.value)}
                type="password"
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
              <input
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                type="password"
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
