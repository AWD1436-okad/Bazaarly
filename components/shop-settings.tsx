"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RestockerPlan = "SIMPLE" | "PRO" | "MAX";

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
    restockIntervalMinutes: number;
  } | null;
  planOptions: Array<{
    plan: RestockerPlan;
    name: string;
    costLabel: string;
    details: string;
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
  const [selectedCurrency, setSelectedCurrency] = useState(currencyCode);
  const [currencySubmitting, setCurrencySubmitting] = useState(false);
  const [maxInterval, setMaxInterval] = useState(autoRestocker?.plan === "MAX" ? autoRestocker.restockIntervalMinutes : 3);

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

  async function updateRestocker(action: "addToCart" | "cancel" | "updateInterval", plan?: RestockerPlan) {
    setRestockerSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("action", action);
      if (plan) {
        formData.set("plan", plan);
        formData.set("restockIntervalMinutes", String(plan === "MAX" ? maxInterval : plan === "PRO" ? 5 : 10));
      }
      const response = await fetch("/settings/auto-restock-subscription", { method: "POST", body: formData });
      const payload = (await response.json()) as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not update Auto Restocker.");
      }

      setMessage(payload.message ?? "Auto Restocker updated.");
      setRestockerOpen(false);
      if (action === "addToCart") {
        router.push("/cart");
        return;
      }
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
                ? `${autoRestocker.planName} checks every ${autoRestocker.restockIntervalMinutes} minutes. ${autoRestocker.nextCheckLabel}`
                : "Automatically buys supplier stock for sold-out items."}
            </p>
          </div>
          <button type="button" className="secondary-button" onClick={() => setRestockerOpen((open) => !open)}>
            {restockerOpen ? "Close plans" : "Manage plan"}
          </button>
        </div>

        {autoRestocker ? (
          <div className="settings-restocker-status">
            <strong>{autoRestocker.costLabel} every 24 hours</strong>
            <span>Item costs are paid from your balance automatically.</span>
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
                <small>{option.details}</small>
                {option.plan === "MAX" ? (
                  <label className="restocker-plan__timer">
                    Check every
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={maxInterval}
                      onChange={(event) => setMaxInterval(Math.min(10, Math.max(1, Number(event.target.value) || 1)))}
                      disabled={restockerSubmitting}
                    />
                    minutes
                  </label>
                ) : null}
                <button
                  type="button"
                  className="secondary-button"
                  disabled={restockerSubmitting || autoRestocker?.plan === option.plan}
                  onClick={() => void updateRestocker("addToCart", option.plan)}
                >
                  {autoRestocker?.plan === option.plan ? "Current plan" : `Add ${option.name} to cart`}
                </button>
              </div>
            ))}
            {autoRestocker?.plan === "MAX" ? (
              <button type="button" className="ghost-button" disabled={restockerSubmitting} onClick={() => void updateRestocker("updateInterval", "MAX")}>
                Save Max timer
              </button>
            ) : null}
            {autoRestocker ? (
              <button type="button" className="ghost-button" disabled={restockerSubmitting} onClick={() => void updateRestocker("cancel")}>
                {restockerSubmitting ? "Saving..." : "Cancel Auto Restocker"}
              </button>
            ) : null}
          </div>
        ) : null}
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
    </section>
  );
}
