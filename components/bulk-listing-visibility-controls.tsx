"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    const actionLabel = action === "pause" ? "pause all active listings" : "resume all paused listings";
    const confirmed = window.confirm(`Are you sure you want to ${actionLabel}?`);
    if (!confirmed) {
      return;
    }

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
          "x-tradex-async": "1",
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
          onClick={() => void updateVisibility("pause")}
          disabled={submitting !== null || activeListingCount <= 0}
        >
          {submitting === "pause" ? "Pausing..." : "Pause All Listings"}
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => void updateVisibility("resume")}
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
    </div>
  );
}
