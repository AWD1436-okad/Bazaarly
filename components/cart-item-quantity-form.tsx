"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CartItemQuantityFormProps = {
  cartItemId: string;
  quantity: number;
  maxQuantity: number;
};

export function CartItemQuantityForm({
  cartItemId,
  quantity,
  maxQuantity,
}: CartItemQuantityFormProps) {
  const router = useRouter();
  const [nextQuantity, setNextQuantity] = useState(quantity);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateItem() {
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("cartItemId", cartItemId);
      formData.set("quantity", String(nextQuantity));

      const response = await fetch("/cart/item", {
        method: "POST",
        body: formData,
        headers: {
          "x-bazaarly-async": "1",
        },
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to update cart item");
      }

      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update cart item");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="cart-item-quantity-form">
      <div className="inline-form">
        <input
          type="number"
          min={0}
          max={maxQuantity}
          value={nextQuantity}
          disabled={submitting}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            if (!Number.isFinite(parsed)) {
              setNextQuantity(0);
              return;
            }

            setNextQuantity(Math.max(0, Math.min(maxQuantity, Math.floor(parsed))));
          }}
        />
        <button type="button" onClick={() => void updateItem()} disabled={submitting}>
          {submitting ? "Updating..." : "Update"}
        </button>
      </div>
      {error ? <span className="status-text status-text--error">{error}</span> : null}
    </div>
  );
}
