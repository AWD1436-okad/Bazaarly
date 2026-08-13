"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

type SoldOutListingActionsProps = {
  listingId: string;
  productName: string;
};

const LONG_PRESS_MS = 450;

export function SoldOutListingActions({
  listingId,
  productName,
}: SoldOutListingActionsProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  function refreshInPlace() {
    const scrollY = window.scrollY;
    router.refresh();
    window.setTimeout(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    }, 60);
  }

  function clearLongPress() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function beginLongPress() {
    clearLongPress();
    timeoutRef.current = window.setTimeout(() => {
      setMenuOpen(true);
    }, LONG_PRESS_MS);
  }

  async function handleDelete() {
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("listingId", listingId);

      const response = await fetch("/listings/delete", {
        method: "POST",
        body: formData,
        headers: {
          "x-profit-planet-async": "1",
        },
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to delete listing");
      }

      setMenuOpen(false);
      setConfirmOpen(false);
      refreshInPlace();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete listing");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => clearLongPress, []);

  return (
    <div
      className="sold-out-listing-actions"
      onContextMenu={(event) => {
        event.preventDefault();
        setMenuOpen((current) => !current);
      }}
      onPointerDown={beginLongPress}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
    >
      <span className="stock-chip stock-chip--soldout">Sold out</span>
      <button
        type="button"
        className="ghost-button small sold-out-listing-actions__toggle"
        aria-label={`More actions for ${productName}`}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((current) => !current)}
        disabled={submitting}
      >
        More
      </button>
      {menuOpen ? (
        <div className="sold-out-listing-actions__menu">
          <button
            type="button"
            className="ghost-button small sold-out-listing-actions__delete"
            onClick={() => setConfirmOpen(true)}
            disabled={submitting}
          >
            {submitting ? "Deleting..." : "Delete"}
          </button>
        </div>
      ) : null}
      {error ? <span className="status-text status-text--error">{error}</span> : null}
      {confirmOpen ? (
        <ConfirmActionDialog
          title="Delete this listing?"
          message={`Remove ${productName} from your shop? Past sales and inventory history will stay safe.`}
          confirmLabel="Delete listing"
          confirmTone="danger"
          submitting={submitting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </div>
  );
}
