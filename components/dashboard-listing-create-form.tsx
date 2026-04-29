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
  displayMarketAverageLabel: string;
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
  const selectedProductId = listingOptions.some((item) => item.productId === productId)
    ? productId
    : (listingOptions[0]?.productId ?? "");

  function refreshInPlace() {
    const scrollY = window.scrollY;
    router.refresh();
    window.setTimeout(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    }, 60);
  }

  async function handlePublish() {
    const selectedOption = listingOptions.find((item) => item.productId === selectedProductId);

    if (!selectedOption) {
      setFeedback(null);
      setError("Select a product to list");
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("productId", selectedProductId);
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
        throw new Error(payload.error ?? "Unable to publish listing");
      }

      setFeedback("Listing published successfully");
      setError(null);
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
        <select
          value={selectedProductId}
          onChange={(event) => {
            setProductId(event.target.value);
            setError(null);
            setFeedback(null);
          }}
        >
          {listingOptions.map((item) => (
            <option key={item.inventoryId} value={item.productId}>
              {item.productName} - {item.availableToList} available to list -{" "}
              {item.displayMarketAverageLabel} {item.unitLabel}
            </option>
          ))}
        </select>
      </label>
      <label>
        Sale price per unit
        <input
          value={price}
          onChange={(event) => {
            setPrice(event.target.value);
            setError(null);
            setFeedback(null);
          }}
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
