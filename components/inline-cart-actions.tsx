"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type InlineCartActionsProps = {
  listingId: string;
  maxQuantity: number;
};

export function InlineCartActions({ listingId, maxQuantity }: InlineCartActionsProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitCartAction(mode: "add" | "buy") {
    const parsedQuantity = Number.parseInt(quantity, 10);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError("Please buy at least 1");
      setFeedback(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.set("listingId", listingId);
      formData.set("quantity", String(parsedQuantity));

      const response = await fetch("/cart/add", {
        method: "POST",
        body: formData,
        headers: {
          "x-bazaarly-async": "1",
        },
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to add to cart");
      }

      setFeedback(mode === "buy" ? "Added. Opening cart..." : "Added to cart");

      if (mode === "buy") {
        router.push("/cart");
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to add to cart",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="listing-card__purchase-stack">
      <div className="inline-cart-form">
        <input
          type="number"
          min={1}
          max={maxQuantity}
          value={quantity}
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
          disabled={submitting}
        />
        <button type="button" onClick={() => void submitCartAction("add")} disabled={submitting}>
          {submitting ? "Adding..." : "Add to cart"}
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => void submitCartAction("buy")}
          disabled={submitting}
        >
          Buy now
        </button>
      </div>
      {feedback ? <span className="muted">{feedback}</span> : null}
      {error ? <span className="status-text status-text--error">{error}</span> : null}
    </div>
  );
}
