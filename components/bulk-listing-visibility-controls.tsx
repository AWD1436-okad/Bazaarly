"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

type BulkListingVisibilityControlsProps = {
  activeListingCount: number;
  pausedListingCount: number;
};

export function BulkListingVisibilityControls({
  activeListingCount,
  pausedListingCount,
}: BulkListingVisibilityControlsProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<null | "pause" | "resume">(null);
  const [pendingAction, setPendingAction] = useState<null | "pause" | "resume">(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refreshInPlace() {
    const scrollY = window.scrollY;
    router.refresh();
    window.setTimeout(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    }, 60);
  }

  async function updateVisibility(action: "pause" | "resume") {
    setSubmitting(action);
    setFeedback(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("action", action);

      const response = await fetch("/listings/bulk-visibility", {
        method: "POST",
        body: formData,
        headers: {
          "x-profit-planet-async": "1",
        },
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to update listings");
      }

      setFeedback(payload.message ?? "Listings updated");
      setPendingAction(null);
      refreshInPlace();
    } catch (visibilityError) {
      setError(
        visibilityError instanceof Error ? visibilityError.message : "Unable to update listings",
      );
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="bulk-listing-visibility">
      <div className="bulk-listing-visibility__buttons">
        <button
          type="button"
          className="ghost-button"
          onClick={() => setPendingAction("pause")}
          disabled={submitting !== null || activeListingCount <= 0}
        >
          {submitting === "pause" ? "Pausing..." : "Pause All Listings"}
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => setPendingAction("resume")}
          disabled={submitting !== null || pausedListingCount <= 0}
        >
          {submitting === "resume" ? "Resuming..." : "Resume All Listings"}
        </button>
      </div>
      <span className="muted">
        {activeListingCount} active, {pausedListingCount} paused
      </span>
      {feedback ? <span className="status-text status-text--success">{feedback}</span> : null}
      {error ? <span className="status-text status-text--error">{error}</span> : null}
      {pendingAction ? (
        <ConfirmActionDialog
          title={pendingAction === "pause" ? "Pause all listings?" : "Resume all listings?"}
          message={pendingAction === "pause" ? "Buyers will not be able to buy your active listings until you resume them." : "Your paused listings will be available for buyers again."}
          confirmLabel={pendingAction === "pause" ? "Pause listings" : "Resume listings"}
          submitting={submitting !== null}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => void updateVisibility(pendingAction)}
        />
      ) : null}
    </div>
  );
}
