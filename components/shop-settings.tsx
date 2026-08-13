"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RestockerPlan = "STARTER" | "ESSENTIAL" | "PLUS" | "PRO" | "ULTIMATE";
type AccountAction = "logout" | "delete";
type AccountStep = "confirm" | "password" | "final";

type ShopSettingsProps = {
  currentShopName: string | null;
  currencyCode: string;
  currencyOptions: Array<{ code: string; label: string }>;
  maskedBankNumber: string;
  renameCostLabel: string;
  autoRestocker: {
    planName: string;
    plan: RestockerPlan;
    costLabel: string;
    nextCheckLabel: string;
    triggerLabel: string;
    restockLabel: string;
  } | null;
  planOptions: Array<{
    plan: RestockerPlan;
    name: string;
    costLabel: string;
    triggerLabel: string;
    restockLabel: string;
  }>;
};

export function ShopSettings({
  currentShopName,
  currencyCode,
  currencyOptions,
  maskedBankNumber,
  renameCostLabel,
  autoRestocker,
  planOptions,
}: ShopSettingsProps) {
  const router = useRouter();
  const [shopName, setShopName] = useState(currentShopName ?? "");
  const [password, setPassword] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameConfirmOpen, setRenameConfirmOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankPassword, setBankPassword] = useState("");
  const [bankNumber, setBankNumber] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restockerOpen, setRestockerOpen] = useState(false);
  const [restockerSubmitting, setRestockerSubmitting] = useState(false);
  const [restockerReplacementPlan, setRestockerReplacementPlan] = useState<RestockerPlan | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(currencyCode);
  const [currencySubmitting, setCurrencySubmitting] = useState(false);
  const [accountAction, setAccountAction] = useState<AccountAction | null>(null);
  const [accountStep, setAccountStep] = useState<AccountStep>("confirm");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountSubmitting, setAccountSubmitting] = useState(false);

  function closeRename() {
    setRenameOpen(false);
    setRenameConfirmOpen(false);
    setPassword("");
  }

  async function renameShop() {
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("name", shopName);
      formData.set("password", password);
      const response = await fetch("/settings/rename-store", { method: "POST", body: formData });
      const payload = (await response.json()) as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not rename your shop.");
      }

      setMessage(payload.message ?? "Shop renamed.");
      closeRename();
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not rename your shop.");
    } finally {
      setSubmitting(false);
    }
  }

  async function revealBankNumber() {
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("password", bankPassword);
      const response = await fetch("/settings/reveal-bank-number", { method: "POST", body: formData });
      const payload = (await response.json()) as { ok?: boolean; bankNumber?: string; error?: string };
      if (!response.ok || !payload.ok || !payload.bankNumber) {
        throw new Error(payload.error ?? "Could not show your bank number.");
      }
      setBankNumber(payload.bankNumber);
      setBankPassword("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not show your bank number.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateRestocker(action: "activate" | "cancel", plan?: RestockerPlan, confirmReplace = false) {
    setRestockerSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("action", action);
      if (plan) {
        formData.set("plan", plan);
      }
      if (confirmReplace) {
        formData.set("confirmReplace", "true");
      }
      const response = await fetch("/settings/auto-restock-subscription", { method: "POST", body: formData });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        requiresReplaceConfirmation?: boolean;
      };
      if (payload.requiresReplaceConfirmation && plan) {
        setRestockerReplacementPlan(plan);
        return;
      }
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not update Auto Restocker.");
      }

      setMessage(payload.message ?? "Auto Restocker updated.");
      setRestockerOpen(false);
      setRestockerReplacementPlan(null);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update Auto Restocker.");
    } finally {
      setRestockerSubmitting(false);
    }
  }

  async function updateCurrency() {
    setCurrencySubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("currencyCode", selectedCurrency);
      const response = await fetch("/settings/price-region", { method: "POST", body: formData });
      const payload = (await response.json()) as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not change currency.");
      }
      setMessage(payload.message ?? "Currency changed.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not change currency.");
    } finally {
      setCurrencySubmitting(false);
    }
  }

  function openAccountAction(action: AccountAction) {
    setError(null);
    setMessage(null);
    setAccountPassword("");
    setAccountAction(action);
    setAccountStep(action === "delete" ? "confirm" : "password");
  }

  function closeAccountAction() {
    if (accountSubmitting) return;
    setAccountAction(null);
    setAccountPassword("");
    setAccountStep("confirm");
  }

  async function verifyAccountPassword() {
    if (!accountPassword) return;

    setAccountSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("password", accountPassword);
      const response = await fetch("/settings/verify-password", { method: "POST", body: formData });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Incorrect password");
      }
      setAccountStep("final");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Incorrect password");
    } finally {
      setAccountSubmitting(false);
    }
  }

  async function confirmAccountAction() {
    if (!accountAction || !accountPassword) return;

    setAccountSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("password", accountPassword);
      if (accountAction === "delete") {
        formData.set("finalConfirmation", "DELETE_ACCOUNT");
      }
      const response = await fetch(
        accountAction === "delete" ? "/settings/delete-account" : "/auth/logout",
        { method: "POST", body: formData },
      );
      const payload = (await response.json()) as { ok?: boolean; redirectTo?: string; error?: string };
      if (!response.ok || !payload.ok || !payload.redirectTo) {
        throw new Error(payload.error ?? "That action could not be completed.");
      }
      window.location.assign(payload.redirectTo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That action could not be completed.");
      setAccountStep("password");
    } finally {
      setAccountSubmitting(false);
    }
  }

  return (
    <section className="settings-layout" aria-label="Shop settings">
      <article className="settings-section settings-panel">
        <div className="settings-section__header">
          <h2>My shop</h2>
          <p className="muted">{currentShopName ?? "Set up your shop first."}</p>
        </div>
        <button type="button" onClick={() => setRenameOpen(true)} disabled={!currentShopName}>
          Change shop name
        </button>
      </article>

      <article className="settings-section settings-panel">
        <div className="settings-section__header">
          <h2>Currency</h2>
          <p className="muted">Choose how money is displayed.</p>
        </div>
        <div className="settings-currency-control">
          <label>
            Display currency
            <select
              value={selectedCurrency}
              disabled={currencySubmitting}
              onChange={(event) => setSelectedCurrency(event.target.value)}
            >
              {currencyOptions.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="secondary-button"
            disabled={currencySubmitting || selectedCurrency === currencyCode}
            onClick={() => void updateCurrency()}
          >
            {currencySubmitting ? "Saving..." : "Save currency"}
          </button>
        </div>
      </article>

      <article className="settings-section settings-panel">
        <div className="settings-section__header">
          <h2>Bank number</h2>
          <p className="muted">{bankNumber ?? maskedBankNumber}</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => { setBankOpen(true); setBankNumber(null); }}>
          Show bank number
        </button>
      </article>

      <article className="settings-section settings-panel">
        <div className="settings-section__header">
          <h2>Shop password</h2>
          <p className="muted">Use it to sign in and confirm shop changes.</p>
        </div>
      </article>

      <article className="settings-section settings-panel settings-section--wide" aria-labelledby="restocker-title">
        <div className="settings-section__header settings-section__header--inline">
          <div>
            <h2 id="restocker-title">Auto Restocker</h2>
            <p className="muted">
              {autoRestocker
                ? `${autoRestocker.triggerLabel}. ${autoRestocker.nextCheckLabel}`
                : "Buys supplier stock automatically when items run low."}
            </p>
          </div>
          <button type="button" className="secondary-button" onClick={() => setRestockerOpen((open) => !open)}>
            {restockerOpen ? "Close plans" : "Manage plan"}
          </button>
        </div>

        {autoRestocker ? (
          <div className="settings-restocker-status">
            <strong>{autoRestocker.costLabel} every 24 hours</strong>
            <span>{autoRestocker.restockLabel}. Item costs are paid from your balance.</span>
          </div>
        ) : null}

        {restockerOpen ? (
          <div className="restocker-plan-list">
            {planOptions.map((option) => (
              <div
                key={option.plan}
                className={autoRestocker?.plan === option.plan ? "restocker-plan restocker-plan--active" : "restocker-plan"}
              >
                <strong>{option.name}</strong>
                <span>{option.costLabel} every 24 hours</span>
                <small>{option.triggerLabel}. {option.restockLabel}.</small>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={restockerSubmitting || autoRestocker?.plan === option.plan}
                  onClick={() => void updateRestocker("activate", option.plan)}
                >
                  {autoRestocker?.plan === option.plan ? "Current plan" : `Start ${option.name}`}
                </button>
              </div>
            ))}
            {autoRestocker ? (
              <button type="button" className="ghost-button" disabled={restockerSubmitting} onClick={() => void updateRestocker("cancel")}>
                {restockerSubmitting ? "Saving..." : "Cancel Auto Restocker"}
              </button>
            ) : null}
          </div>
        ) : null}
      </article>

      {restockerReplacementPlan ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !restockerSubmitting && setRestockerReplacementPlan(null)}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="replace-restocker-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-card__copy">
              <h2 id="replace-restocker-title">Switch Auto Restocker plan?</h2>
              <p>
                Your current plan will stop now. The new {planOptions.find((plan) => plan.plan === restockerReplacementPlan)?.name} plan starts straight away and charges for its first 24 hours.
              </p>
            </div>
            <div className="modal-card__actions">
              <button type="button" className="secondary-button" disabled={restockerSubmitting} onClick={() => setRestockerReplacementPlan(null)}>
                Keep current plan
              </button>
              <button type="button" disabled={restockerSubmitting} onClick={() => void updateRestocker("activate", restockerReplacementPlan, true)}>
                {restockerSubmitting ? "Starting..." : "Switch plan"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <article className="settings-section settings-panel settings-section--wide settings-section--account" aria-labelledby="account-title">
        <div className="settings-section__header">
          <h2 id="account-title">Account</h2>
          <p className="muted">Log out when you are finished. Deleting your account cannot be undone.</p>
        </div>
        <div className="settings-account-actions">
          <button type="button" className="secondary-button" onClick={() => openAccountAction("logout")}>Log out</button>
          <button type="button" className="danger-button" onClick={() => openAccountAction("delete")}>Delete account</button>
        </div>
      </article>

      {message ? <p className="form-success" role="status">{message}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      {renameOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !submitting && closeRename()}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="rename-shop-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-card__copy">
              <h2 id="rename-shop-title">Change shop name</h2>
              <p>It costs {renameCostLabel}.</p>
            </div>
            <label className="modal-card__field">
              Shop name
              <input value={shopName} onChange={(event) => setShopName(event.target.value)} maxLength={48} autoFocus />
            </label>
            <label className="modal-card__field">
              Shop password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            </label>
            <div className="modal-card__actions">
              <button type="button" className="secondary-button" disabled={submitting} onClick={closeRename}>Cancel</button>
              <button type="button" disabled={!shopName.trim() || !password} onClick={() => { setRenameOpen(false); setRenameConfirmOpen(true); }}>
                Continue
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {renameConfirmOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !submitting && closeRename()}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="confirm-rename-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-card__copy">
              <h2 id="confirm-rename-title">Are you sure?</h2>
              <p>Change your shop name to <strong>{shopName.trim()}</strong> for {renameCostLabel}?</p>
            </div>
            <div className="modal-card__actions">
              <button type="button" className="secondary-button" disabled={submitting} onClick={() => { setRenameConfirmOpen(false); setRenameOpen(true); }}>Go back</button>
              <button type="button" disabled={submitting} onClick={() => void renameShop()}>
                {submitting ? "Changing..." : "Yes, change name"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {bankOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !submitting && setBankOpen(false)}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="bank-number-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-card__copy">
              <h2 id="bank-number-title">Your bank number</h2>
              <p>Enter your shop password to show it.</p>
            </div>
            {bankNumber ? <strong className="settings-bank-number">{bankNumber}</strong> : (
              <label className="modal-card__field">
                Shop password
                <input type="password" value={bankPassword} onChange={(event) => setBankPassword(event.target.value)} autoComplete="current-password" autoFocus />
              </label>
            )}
            <div className="modal-card__actions">
              <button type="button" className="secondary-button" disabled={submitting} onClick={() => setBankOpen(false)}>Done</button>
              {!bankNumber ? <button type="button" disabled={submitting || !bankPassword} onClick={() => void revealBankNumber()}>{submitting ? "Showing..." : "Show bank number"}</button> : null}
            </div>
          </section>
        </div>
      ) : null}

      {accountAction ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeAccountAction}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="account-action-title" onMouseDown={(event) => event.stopPropagation()}>
            {accountAction === "delete" && accountStep === "confirm" ? (
              <div className="modal-card__copy">
                <h2 id="account-action-title">Delete your account?</h2>
                <p>Your shop will be closed and you will be logged out.</p>
              </div>
            ) : accountAction === "delete" && accountStep === "final" ? (
              <div className="modal-card__copy">
                <h2 id="account-action-title">Are you really sure?</h2>
                <p>This permanently closes your Profit Planet account.</p>
              </div>
            ) : accountAction === "logout" && accountStep === "final" ? (
              <div className="modal-card__copy">
                <h2 id="account-action-title">Log out?</h2>
                <p>You will need your shop password to sign in again.</p>
              </div>
            ) : (
              <>
                <div className="modal-card__copy">
                  <h2 id="account-action-title">Enter your shop password</h2>
                  <p>{accountAction === "delete" ? "Confirm your password before deleting your account." : "Confirm your password before logging out."}</p>
                </div>
                <label className="modal-card__field">
                  Shop password
                  <input type="password" value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} autoComplete="current-password" autoFocus />
                </label>
              </>
            )}
            <div className="modal-card__actions">
              <button type="button" className="secondary-button" disabled={accountSubmitting} onClick={closeAccountAction}>Cancel</button>
              {accountStep === "confirm" ? (
                <button type="button" className={accountAction === "delete" ? "danger-button" : undefined} onClick={() => setAccountStep("password")}>Yes, continue</button>
              ) : accountStep === "password" ? (
                <button type="button" disabled={!accountPassword || accountSubmitting} onClick={() => void verifyAccountPassword()}>{accountSubmitting ? "Checking..." : "Continue"}</button>
              ) : (
                <button type="button" className={accountAction === "delete" ? "danger-button" : undefined} disabled={accountSubmitting} onClick={() => void confirmAccountAction()}>
                  {accountSubmitting ? "Working..." : accountAction === "delete" ? "Yes, delete account" : "Yes, log out"}
                </button>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
