"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type SoldOutRestockItem = {
  productId: string;
  name: string;
  categoryLabel: string;
  unitLabel: string;
  supplierStock: number;
  supplierPriceLabel: string;
};

type SupplierRestockNeededFormProps = {
  items: SoldOutRestockItem[];
};

export function SupplierRestockNeededForm({ items }: SupplierRestockNeededFormProps) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, string>>(
    Object.fromEntries(items.map((item) => [item.productId, "0"])),
  );
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasPositiveSelection = useMemo(
    () =>
      Object.values(quantities).some((raw) => {
        const parsed = Number.parseInt(raw, 10);
        return Number.isFinite(parsed) && parsed > 0;
      }),
    [quantities],
  );

  async function handleAddSelected() {
    if (!hasPositiveSelection) {
      setError("Select at least one product quantity greater than zero");
      setFeedback(null);
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      const formData = new FormData();
      items.forEach((item) => {
        formData.set(`qty:${item.productId}`, quantities[item.productId] ?? "0");
      });

      const response = await fetch("/supplier/restock-needed", {
        method: "POST",
        body: formData,
        headers: {
          "x-tradex-async": "1",
        },
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        selectedCount?: number;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to add selected restocks to cart");
      }

      setFeedback("Added to cart");
      setQuantities(Object.fromEntries(items.map((item) => [item.productId, "0"])));
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to add selected restocks to cart",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="table-list">
      {items.map((item) => (
        <div key={item.productId} className="table-row">
          <div className="table-row__meta">
            <strong>{item.name}</strong>
            <span className="muted">
              {item.categoryLabel} - {item.supplierPriceLabel} - {item.supplierStock} supplier stock
            </span>
          </div>
          <div className="table-row__actions">
            <input
              type="number"
              min={0}
              max={Math.max(item.supplierStock, 0)}
              value={quantities[item.productId] ?? "0"}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === "") {
                  setQuantities((current) => ({ ...current, [item.productId]: "" }));
                  return;
                }
                if (!/^\d+$/.test(nextValue)) {
                  return;
                }
                const parsed = Number.parseInt(nextValue, 10);
                const bounded = Math.min(Math.max(parsed, 0), item.supplierStock);
                setQuantities((current) => ({ ...current, [item.productId]: String(bounded) }));
              }}
              disabled={submitting}
              aria-label={`Quantity for ${item.name}`}
            />
          </div>
        </div>
      ))}
      <div className="section-row">
        <span className="muted">Set quantity to 0 to skip an item.</span>
        <button type="button" onClick={() => void handleAddSelected()} disabled={submitting}>
          {submitting ? "Adding..." : "Add selected to cart"}
        </button>
      </div>
      {feedback ? (
        <span className="muted">
          {feedback} - <Link href="/cart">View cart</Link> - <Link href="/checkout">Checkout</Link>
        </span>
      ) : null}
      {error ? <span className="status-text status-text--error">{error}</span> : null}
    </div>
  );
}
