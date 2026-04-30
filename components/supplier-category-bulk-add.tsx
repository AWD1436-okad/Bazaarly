"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SupplierCategoryBulkAddProps = {
  categoryValue: string;
};

export function SupplierCategoryBulkAdd({ categoryValue }: SupplierCategoryBulkAddProps) {
  const router = useRouter();
  const [quantityPerItem, setQuantityPerItem] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAddAllToCart() {
    const parsedQuantity = Number.parseInt(quantityPerItem, 10);
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
      formData.set("category", categoryValue);
      formData.set("quantityPerItem", String(parsedQuantity));

      const response = await fetch("/supplier/add-category", {
        method: "POST",
        body: formData,
        headers: {
          "x-tradex-async": "1",
        },
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        addedCount?: number;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to add category items to cart");
      }

      setFeedback(
        payload.addedCount && payload.addedCount > 0
          ? `Added to cart (${payload.addedCount} items)`
          : "Added to cart",
      );
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to add category items to cart",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="supplier-bulk-action">
      <label className="stack-xs" style={{ minWidth: 120 }}>
        Qty each
        <input
          type="number"
          min={1}
          max={99}
          value={quantityPerItem}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (nextValue === "") {
              setQuantityPerItem("");
              return;
            }
            if (!/^\d+$/.test(nextValue)) {
              return;
            }
            setQuantityPerItem(nextValue);
          }}
          disabled={submitting}
        />
      </label>
      <button type="button" onClick={() => void handleAddAllToCart()} disabled={submitting}>
        {submitting ? "Adding..." : "Add all to cart"}
      </button>
      {feedback ? (
        <span className="muted">
          {feedback} - <Link href="/cart">View cart</Link> - <Link href="/checkout">Checkout</Link>
        </span>
      ) : null}
      {error ? <span className="status-text status-text--error">{error}</span> : null}
    </div>
  );
}
