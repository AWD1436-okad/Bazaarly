"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ShopSettingsProps = {
  currentShopName: string | null;
  maskedBankNumber: string;
};

export function ShopSettings({ currentShopName, maskedBankNumber }: ShopSettingsProps) {
  const router = useRouter();
  const [shopName, setShopName] = useState(currentShopName ?? "");
  const [password, setPassword] = useState("");
  const [editing, setEditing] = useState(false);
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

  return (
    <section className="settings-layout" aria-label="Shop settings">
      <article className="settings-section">
        <div className="section-row">
          <div>
            <h2>My shop</h2>
            <p className="muted">{currentShopName ?? "Set up your shop first."}</p>
          </div>
          {currentShopName ? (
            <button type="button" className="secondary-button" onClick={() => setEditing(true)}>
              Rename shop
            </button>
          ) : null}
        </div>
      </article>

      <article className="settings-section">
        <h2>Bank number</h2>
        <p className="muted">Your in-game bank number: {maskedBankNumber}</p>
      </article>

      <article className="settings-section">
        <h2>Shop password</h2>
        <p className="muted">Use your password to confirm important shop changes.</p>
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
              <p>This costs game money. Enter your shop password to confirm.</p>
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
    </section>
  );
}
