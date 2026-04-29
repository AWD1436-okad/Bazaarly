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
  const [nextQuantity, setNextQuantity] = useState(String(quantity));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refreshInPlace() {
    const scrollY = window.scrollY;
    router.refresh();
    window.setTimeout(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    }, 60);
  }

  async function updateItem() {
    if (nextQuantity === "") {
      setError("Enter a quantity or use 0 to remove");
      return;
    }

    const parsedQuantity = Number.parseInt(nextQuantity, 10);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      setError("Enter a valid quantity");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("cartItemId", cartItemId);
      formData.set("quantity", String(parsedQuantity));

      const response = await fetch("/cart/item", {
        method: "POST",
        body: formData,
        headers: {
          "x-tradex-async": "1",
        },
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to update cart item");
      }

      refreshInPlace();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update cart item");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeItem() {
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("cartItemId", cartItemId);
      formData.set("quantity", "0");

      const response = await fetch("/cart/item", {
        method: "POST",
        body: formData,
        headers: {
          "x-tradex-async": "1",
        },
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to remove cart item");
      }

      refreshInPlace();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove cart item");
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
            const nextValue = event.target.value;
            if (nextValue === "") {
              setNextQuantity("");
              return;
            }

            if (!/^\d+$/.test(nextValue)) {
              return;
            }

            setNextQuantity(nextValue);
          }}
        />
        <button type="button" onClick={() => void updateItem()} disabled={submitting}>
          {submitting ? "Updating..." : "Update"}
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => void removeItem()}
          disabled={submitting}
        >
          Remove
        </button>
      </div>
      {error ? <span className="status-text status-text--error">{error}</span> : null}
    </div>
  );
}
