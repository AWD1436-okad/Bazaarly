"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ShopSettingsProps = {
  currentShopName: string | null;
  maskedBankNumber: string;
  renameCostLabel: string;
};

export function ShopSettings({ currentShopName, maskedBankNumber, renameCostLabel }: ShopSettingsProps) {
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
