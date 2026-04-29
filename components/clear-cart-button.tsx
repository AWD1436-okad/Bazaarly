"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClearCartButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refreshInPlace() {
    const scrollY = window.scrollY;
    router.refresh();
    window.setTimeout(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    }, 60);
  }

  async function clearCart() {
    const confirmed = window.confirm("Are you sure you want to clear your cart?");
    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/cart/clear", {
        method: "POST",
        headers: {
          "x-tradex-async": "1",
        },
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to clear cart");
      }

      refreshInPlace();
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Unable to clear cart");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="clear-cart-action">
      <button
        type="button"
        className="ghost-button"
        onClick={() => void clearCart()}
        disabled={submitting}
      >
        {submitting ? "Clearing..." : "Clear Cart"}
      </button>
      {error ? <span className="status-text status-text--error">{error}</span> : null}
    </div>
  );
}
