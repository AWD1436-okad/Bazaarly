"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type BulkSoldOutCleanupProps = {
  soldOutCount: number;
};

export function BulkSoldOutCleanup({ soldOutCount }: BulkSoldOutCleanupProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const hasSoldOutListings = soldOutCount > 0;
  const soldOutSummary = useMemo(() => {
    if (soldOutCount === 1) {
      return "1 sold-out listing";
    }

    return `${soldOutCount} sold-out listings`;
  }, [soldOutCount]);

  function closeModal() {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setPassword("");
    setError(null);
  }

  function refreshInPlace() {
    const scrollY = window.scrollY;
    router.refresh();
    window.setTimeout(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    }, 60);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.set("password", password);

      const response = await fetch("/listings/delete-sold-out", {
        method: "POST",
        body: formData,
        headers: {
          "x-bazaarly-async": "1",
        },
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to remove sold-out listings");
      }

      setFeedback(payload.message ?? "Sold-out listings removed successfully");
      setPassword("");
      setModalOpen(false);
      refreshInPlace();
    } catch (cleanupError) {
      setError(
        cleanupError instanceof Error
          ? cleanupError.message
          : "Unable to remove sold-out listings",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bulk-sold-out-cleanup">
      <div className="bulk-sold-out-cleanup__trigger">
        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            setError(null);
            setFeedback(null);
            setModalOpen(true);
          }}
          disabled={submitting}
        >
          Remove All Sold-Out Listings
        </button>
        <span className="muted">
          {hasSoldOutListings
            ? `${soldOutSummary} ready to remove`
            : "No sold-out listings to remove"}
        </span>
      </div>

      {feedback ? <span className="status-text status-text--success">{feedback}</span> : null}
      {error && !modalOpen ? <span className="status-text status-text--error">{error}</span> : null}

      {modalOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => closeModal()}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-sold-out-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h3 id="bulk-sold-out-title">Remove all sold-out listings?</h3>
              <p>
                This will remove only sold-out listings from your shop. Active listings with stock,
                past orders, transaction history, and inventory records will stay intact.
              </p>
            </div>

            <label className="modal-card__field">
              Confirm with your password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={submitting}
              />
            </label>

            {error ? <span className="status-text status-text--error">{error}</span> : null}

            <div className="modal-card__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => closeModal()}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="button" onClick={() => void handleConfirm()} disabled={submitting}>
                {submitting ? "Removing..." : "Confirm removal"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
