"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DashboardListingManageFormProps = {
  listingId: string;
  productId: string;
  defaultPrice: string;
};

export function DashboardListingManageForm({
  listingId,
  productId,
  defaultPrice,
}: DashboardListingManageFormProps) {
  const router = useRouter();
  const [price, setPrice] = useState(defaultPrice);
  const [submitting, setSubmitting] = useState<null | "save" | "pause">(null);
  const [error, setError] = useState<string | null>(null);

  function refreshInPlace() {
    const scrollY = window.scrollY;
    router.refresh();
    window.setTimeout(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    }, 60);
  }

  async function handleSave() {
    setSubmitting("save");
    setError(null);

    try {
      const formData = new FormData();
      formData.set("productId", productId);
      formData.set("price", price);

      const response = await fetch("/listings/save", {
        method: "POST",
        body: formData,
        headers: {
          "x-tradex-async": "1",
        },
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to save listing");
      }

      refreshInPlace();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save listing");
    } finally {
      setSubmitting(null);
    }
  }

  async function handlePause() {
    setSubmitting("pause");
    setError(null);

    try {
      const formData = new FormData();
      formData.set("listingId", listingId);

      const response = await fetch("/listings/pause", {
        method: "POST",
        body: formData,
        headers: {
          "x-tradex-async": "1",
        },
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to remove listing");
      }

      refreshInPlace();
    } catch (pauseError) {
      setError(pauseError instanceof Error ? pauseError.message : "Unable to remove listing");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="dashboard-listing-manage-form">
      <div className="inline-form">
        <input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          name="price"
          type="number"
          min={0.01}
          step="0.01"
          disabled={submitting !== null}
        />
        <button type="button" onClick={() => void handleSave()} disabled={submitting !== null}>
          {submitting === "save" ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => void handlePause()}
          disabled={submitting !== null}
        >
          {submitting === "pause" ? "Removing..." : "Remove"}
        </button>
      </div>
      {error ? <span className="status-text status-text--error">{error}</span> : null}
    </div>
  );
}
