"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ShopSettingsProps = {
  currentShopName: string | null;
  maskedBankNumber: string;
  renameCostLabel: string;
  autoRestocker: {
    planName: string;
    plan: "SIMPLE" | "PRO" | "MAX";
    costLabel: string;
    nextCheckLabel: string;
    fullAccessEnabled: boolean;
  } | null;
  planOptions: Array<{
    plan: "SIMPLE" | "PRO" | "MAX";
    name: string;
    costLabel: string;
  }>;
};

export function ShopSettings({
  currentShopName,
  maskedBankNumber,
  renameCostLabel,
  autoRestocker,
  planOptions,
}: ShopSettingsProps) {
  const router = useRouter();
  const [shopName, setShopName] = useState(currentShopName ?? "");
  const [password, setPassword] = useState("");
  const [editing, setEditing] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankPassword, setBankPassword] = useState("");
  const [bankNumber, setBankNumber] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restockerOpen, setRestockerOpen] = useState(false);
  const [restockerSubmitting, setRestockerSubmitting] = useState(false);

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
      setPassword("");
      setEditing(false);
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

  async function updateRestocker(action: "activate" | "cancel", plan?: "SIMPLE" | "PRO" | "MAX") {
    setRestockerSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("action", action);
      if (plan) {
        formData.set("plan", plan);
        // Choosing a plan in this compact view intentionally replaces the old one.
        formData.set("confirmReplace", "true");
      }
      const response = await fetch("/settings/auto-restock-subscription", { method: "POST", body: formData });
      const payload = (await response.json()) as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not update Auto Restocker.");
      }

      setMessage(payload.message ?? "Auto Restocker updated.");
      setRestockerOpen(false);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update Auto Restocker.");
    } finally {
      setRestockerSubmitting(false);
    }
  }

  return (
    <section className="settings-layout" aria-label="Shop settings">
      <article className="settings-section">
        <h2>My shop</h2>
        <button type="button" className="settings-shop-button" onClick={() => setEditing(true)} disabled={!currentShopName}>
          <strong>{currentShopName ?? "Set up your shop first."}</strong>
          <span>Change shop name</span>
        </button>
      </article>

      <article className="settings-section">
        <h2>Bank number</h2>
        <p className="muted">{bankNumber ?? maskedBankNumber}</p>
        <button type="button" className="secondary-button" onClick={() => { setBankOpen(true); setBankNumber(null); }}>
          Show bank number
        </button>
      </article>

      <article className="settings-section">
        <h2>Shop password</h2>
        <p className="muted">Used to sign in and confirm shop changes.</p>
      </article>

      <article className="settings-section settings-section--wide" aria-labelledby="restocker-title">
        <div className="settings-section__header settings-section__header--inline">
          <div>
            <h2 id="restocker-title">Auto Restocker</h2>
            <p className="muted">
              {autoRestocker
                ? `${autoRestocker.planName} plan. ${autoRestocker.nextCheckLabel}`
                : "Choose a plan to buy stock again when it sells out."}
            </p>
          </div>
          <button type="button" className="secondary-button" onClick={() => setRestockerOpen((open) => !open)}>
            {restockerOpen ? "Close plans" : "Manage plan"}
          </button>
        </div>

        {autoRestocker ? (
          <div className="settings-restocker-status">
            <strong>{autoRestocker.costLabel} every 48 hours</strong>
            <span>{autoRestocker.fullAccessEnabled ? "Full Access is on" : "Ask before buying stock"}</span>
          </div>
        ) : null}

        <div className="settings-section__actions">
          <Link className="primary-button" href="/dashboard/supplier#restock-sold-out">
            Restock sold-out items
          </Link>
        </div>

        {restockerOpen ? (
          <div className="restocker-plan-list">
            {planOptions.map((option) => (
              <button
                key={option.plan}
                type="button"
                className={autoRestocker?.plan === option.plan ? "restocker-plan restocker-plan--active" : "restocker-plan"}
                disabled={restockerSubmitting}
                onClick={() => void updateRestocker("activate", option.plan)}
              >
                <strong>{option.name}</strong>
                <span>{option.costLabel} every 48 hours</span>
                <small>{autoRestocker?.plan === option.plan ? "Current plan" : "Choose plan"}</small>
              </button>
            ))}
            {autoRestocker ? (
              <button
                type="button"
                className="ghost-button"
                disabled={restockerSubmitting}
                onClick={() => void updateRestocker("cancel")}
              >
                {restockerSubmitting ? "Saving..." : "Cancel Auto Restocker"}
              </button>
            ) : null}
          </div>
        ) : null}
      </article>

      {message ? <p className="form-success" role="status">{message}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      {editing ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !submitting && setEditing(false)}>
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-shop-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h2 id="rename-shop-title">Rename your shop</h2>
              <p>This costs {renameCostLabel}. Enter your shop password to confirm.</p>
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
              <button type="button" className="secondary-button" disabled={submitting} onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button type="button" disabled={submitting || !shopName.trim() || !password} onClick={() => void renameShop()}>
                {submitting ? "Renaming..." : "Rename shop"}
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
