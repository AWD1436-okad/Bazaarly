"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/money";

type SoldOutRestockItem = {
  productId: string;
  name: string;
  categoryLabel: string;
  unitLabel: string;
  supplierStock: number;
  supplierPriceCents: number;
  supplierPriceLabel: string;
};

type SupplierRestockNeededModalProps = {
  items: SoldOutRestockItem[];
  currencyCode: string;
};

export function SupplierRestockNeededModal({ items, currencyCode }: SupplierRestockNeededModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tierQuantities, setTierQuantities] = useState<Record<string, string>>({
    below_1: "0",
    above_1: "0",
    above_5: "0",
    above_10: "0",
    above_20: "0",
    above_50: "0",
    above_100: "0",
  });
  const [submitting, setSubmitting] = useState(false);
  const [applyAllQuantity, setApplyAllQuantity] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tierDefinitions = useMemo(
    () => [
      { key: "below_1", label: `Below ${formatCurrency(100, currencyCode)}` },
      { key: "above_1", label: `Above ${formatCurrency(100, currencyCode)}` },
      { key: "above_5", label: `Above ${formatCurrency(500, currencyCode)}` },
      { key: "above_10", label: `Above ${formatCurrency(1000, currencyCode)}` },
      { key: "above_20", label: `Above ${formatCurrency(2000, currencyCode)}` },
      { key: "above_50", label: `Above ${formatCurrency(5000, currencyCode)}` },
      { key: "above_100", label: `${formatCurrency(10000, currencyCode)}+` },
    ],
    [currencyCode],
  );

  function resolveTierKeyByPrice(priceCents: number) {
    const audDollars = priceCents / 100;
    if (audDollars >= 100) return "above_100";
    if (audDollars >= 50) return "above_50";
    if (audDollars >= 20) return "above_20";
    if (audDollars >= 10) return "above_10";
    if (audDollars >= 5) return "above_5";
    if (audDollars >= 1) return "above_1";
    return "below_1";
  }

  const tierItemCounts = useMemo(() => {
    const counts = Object.fromEntries(tierDefinitions.map((tier) => [tier.key, 0])) as Record<string, number>;
    for (const item of items) {
      const tierKey = resolveTierKeyByPrice(item.supplierPriceCents);
      if (!tierKey) continue;
      counts[tierKey] += 1;
    }
    return counts;
  }, [items, tierDefinitions]);

  const visibleTierDefinitions = useMemo(
    () => tierDefinitions.filter((tier) => tierItemCounts[tier.key] > 0),
    [tierDefinitions, tierItemCounts],
  );

  const hasPositiveSelection = useMemo(() => {
    return visibleTierDefinitions.some((tier) => {
      const parsed = Number.parseInt(tierQuantities[tier.key] ?? "0", 10);
      return Number.isFinite(parsed) && parsed > 0;
    });
  }, [tierQuantities, visibleTierDefinitions]);

  function handleApplyAll() {
    const parsed = Number.parseInt(applyAllQuantity, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid quantity to apply");
      return;
    }
    const bounded = Math.min(parsed, 99);
    setTierQuantities((current) => {
      const next = { ...current };
      for (const tier of visibleTierDefinitions) {
        next[tier.key] = String(bounded);
      }
      return next;
    });
    setError(null);
  }

  async function handleAddSelected() {
    if (!hasPositiveSelection) {
      setError("Select at least one tier quantity greater than zero");
      setFeedback(null);
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      const formData = new FormData();
      for (const tier of visibleTierDefinitions) {
        formData.set(`tier:${tier.key}`, tierQuantities[tier.key] ?? "0");
      }

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

      setFeedback("Added restock items to cart");
      setTierQuantities({
        below_1: "0",
        above_1: "0",
        above_5: "0",
        above_10: "0",
        above_20: "0",
        above_50: "0",
        above_100: "0",
      });
      setOpen(false);
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
    <div className="stack-sm">
      <div className="section-row">
        <button type="button" className="ghost-button" onClick={() => setOpen(true)}>
          Restock sold-out items
        </button>
        {feedback ? (
          <span className="muted">
            {feedback} - <Link href="/cart">View cart</Link> - <Link href="/checkout">Checkout</Link>
          </span>
        ) : null}
      </div>
      {error ? <span className="status-text status-text--error">{error}</span> : null}
      {open ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="restock-sold-out-title"
            className="modal-card modal-card--wide"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h3 id="restock-sold-out-title">Restock sold-out items</h3>
              <p>Set restock quantity by price tier, then add selected items to your cart.</p>
            </div>
            {visibleTierDefinitions.length === 0 ? (
              <div className="empty-state">No sold-out items to restock.</div>
            ) : (
              <>
                <div className="section-row">
                  <label className="stack-xs" style={{ minWidth: 120 }}>
                    Set all quantities
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={applyAllQuantity}
                      onChange={(event) => setApplyAllQuantity(event.target.value)}
                      disabled={submitting}
                    />
                  </label>
                  <button type="button" className="ghost-button" onClick={handleApplyAll} disabled={submitting}>
                    Apply to all
                  </button>
                </div>
                <div className="table-list">
                  {visibleTierDefinitions.map((tier) => (
                <div key={tier.key} className="table-row">
                  <div className="table-row__meta">
                    <strong>{tier.label}</strong>
                    <span className="muted">
                      {tierItemCounts[tier.key]} sold-out item{tierItemCounts[tier.key] === 1 ? "" : "s"} in this tier
                    </span>
                  </div>
                  <div className="table-row__actions">
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={tierQuantities[tier.key] ?? "0"}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        if (nextValue === "") {
                          setTierQuantities((current) => ({ ...current, [tier.key]: "" }));
                          return;
                        }
                        if (!/^\d+$/.test(nextValue)) {
                          return;
                        }
                        const parsed = Number.parseInt(nextValue, 10);
                        const bounded = Math.min(Math.max(parsed, 0), 99);
                        setTierQuantities((current) => ({ ...current, [tier.key]: String(bounded) }));
                      }}
                      disabled={submitting}
                      aria-label={`Quantity for ${tier.label}`}
                    />
                  </div>
                </div>
                  ))}
                </div>
              </>
            )}
            <div className="modal-card__actions">
              <button type="button" className="ghost-button" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAddSelected()}
                disabled={submitting || visibleTierDefinitions.length === 0}
              >
                {submitting ? "Adding..." : "Add selected to cart"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
