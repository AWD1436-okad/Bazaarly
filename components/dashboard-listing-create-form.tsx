"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ListingOption = {
  inventoryId: string;
  productId: string;
  productName: string;
  unitLabel: string;
  availableToList: number;
  marketAveragePrice: number;
};

type DashboardListingCreateFormProps = {
  listingOptions: ListingOption[];
  defaultListingPrice: string;
};

export function DashboardListingCreateForm({
  listingOptions,
  defaultListingPrice,
}: DashboardListingCreateFormProps) {
  const router = useRouter();
  const [productId, setProductId] = useState(listingOptions[0]?.productId ?? "");
  const [price, setPrice] = useState(defaultListingPrice);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refreshInPlace() {
    const scrollY = window.scrollY;
    router.refresh();
    window.setTimeout(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    }, 60);
  }

  async function handlePublish() {
    setSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("productId", productId);
      formData.set("price", price);

      const response = await fetch("/listings/save", {
        method: "POST",
        body: formData,
        headers: {
          "x-bazaarly-async": "1",
        },
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to publish listing");
      }

      setFeedback("Listing updated");
      refreshInPlace();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Unable to publish listing");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack-sm">
      <label>
        Product
        <select value={productId} onChange={(event) => setProductId(event.target.value)}>
          {listingOptions.map((item) => (
            <option key={item.inventoryId} value={item.productId}>
              {item.productName} - {item.availableToList} available to list -{" "}
              ${(item.marketAveragePrice / 100).toFixed(2)} {item.unitLabel}
            </option>
          ))}
        </select>
      </label>
      <label>
        Sale price per unit
        <input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          name="price"
          type="number"
          min={0.01}
          step="0.01"
        />
      </label>
      <div className="dashboard-listing-form__actions">
        <button type="button" onClick={() => void handlePublish()} disabled={submitting}>
          {submitting ? "Publishing..." : "Publish listing"}
        </button>
      </div>
      {feedback ? <span className="muted">{feedback}</span> : null}
      {error ? <span className="status-text status-text--error">{error}</span> : null}
    </div>
  );
}
