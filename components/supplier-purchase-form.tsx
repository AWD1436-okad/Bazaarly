"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SupplierPurchaseFormProps = {
  productId: string;
  supplierStock: number;
};

export function SupplierPurchaseForm({
  productId,
  supplierStock,
}: SupplierPurchaseFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState("1");
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

  async function handleAddToCart() {
    const parsedQuantity = Number.parseInt(quantity, 10);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError("Please buy at least 1");
      setFeedback(null);
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("productId", productId);
      formData.set("quantity", String(parsedQuantity));

      const response = await fetch("/supplier/buy", {
        method: "POST",
        body: formData,
        headers: {
          "x-bazaarly-async": "1",
        },
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        restockedListing?: boolean;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to add supplier item to cart");
      }

      setFeedback("Added to cart");
      refreshInPlace();
    } catch (purchaseError) {
      setError(
        purchaseError instanceof Error ? purchaseError.message : "Unable to add supplier item to cart",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="supplier-buy-form">
      <label className="supplier-buy-form__quantity">
        Quantity
        <input
          type="number"
          min={1}
          max={Math.max(supplierStock, 1)}
          value={quantity}
          disabled={supplierStock <= 0 || submitting}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (nextValue === "") {
              setQuantity("");
              return;
            }

            if (!/^\d+$/.test(nextValue)) {
              return;
            }

            setQuantity(nextValue);
          }}
        />
      </label>
      <button
        type="button"
        onClick={() => void handleAddToCart()}
        disabled={supplierStock <= 0 || submitting}
      >
        {supplierStock > 0 ? (submitting ? "Adding..." : "Add to cart") : "Out of stock"}
      </button>
      {feedback ? <span className="muted">{feedback}</span> : null}
      {error ? <span className="status-text status-text--error">{error}</span> : null}
    </div>
  );
}
