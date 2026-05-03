"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type PendingRestock = {
  id: string;
  plan: "SIMPLE" | "PRO" | "MAX";
  planName: string;
  estimatedCost: string;
  estimatedCostCents: number;
  currentBalance: string;
  currentBalanceCents: number;
  balanceAfter: string;
  balanceAfterCents: number;
  canSkip: boolean;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitLabel: string;
    lineTotal: string;
  }>;
};

export function AutoRestockApprovalGate() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingRestock | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"summary" | "secure">("summary");
  const [password, setPassword] = useState("");
  const [checkoutPin, setCheckoutPin] = useState("");
  const [bankNumber, setBankNumber] = useState("");
  const [busyAction, setBusyAction] = useState<null | "skip" | "approve">(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isMax = pending?.plan === "MAX";
  const totalItems = useMemo(
    () => pending?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [pending],
  );

  useEffect(() => {
    let active = true;
    let timeout: number | undefined;

    const poll = async () => {
      if (!active) return;
      try {
        const response = await fetch("/api/auto-restock/pending", { cache: "no-store" });
        const payload = (await response.json()) as { pending?: PendingRestock | null };
        if (!active) return;
        const nextPending = payload.pending ?? null;
        setPending(nextPending);
        if (!nextPending) {
          setStage("summary");
          setPassword("");
          setCheckoutPin("");
          setBankNumber("");
          setError(null);
        }
      } catch {
        // Ignore intermittent polling failures.
      } finally {
        timeout = window.setTimeout(poll, 7000 + Math.floor(Math.random() * 2500));
      }
    };

    void poll();

    return () => {
      active = false;
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, []);

  async function submitDecision(action: "skip" | "approve") {
    if (!pending || loading) return;
    setLoading(true);
    setBusyAction(action);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("requestId", pending.id);
      formData.set("action", action);
      if (action === "approve") {
        formData.set("password", password);
        formData.set("checkoutPin", checkoutPin);
        formData.set("bankNumber", bankNumber);
      }

      const response = await fetch("/api/auto-restock/decision", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Auto Restock action failed");
      }

      setSuccessMessage(
        action === "approve" ? "Auto Restock purchase completed" : "Auto Restock skipped for this cycle",
      );
      setPending(null);
      setStage("summary");
      setPassword("");
      setCheckoutPin("");
      setBankNumber("");
      router.refresh();
      window.setTimeout(() => setSuccessMessage(null), 4500);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Auto Restock action failed");
    } finally {
      setLoading(false);
      setBusyAction(null);
    }
  }

  if (!pending) {
    return successMessage ? (
      <div className="auto-restock-status" role="status">
        {successMessage}
      </div>
    ) : null;
  }

  return (
    <div className="modal-backdrop auto-restock-backdrop" role="presentation">
      <div className="modal-card modal-card--wide auto-restock-modal" role="dialog" aria-modal="true">
        {pending.canSkip ? (
          <button
            type="button"
            className="modal-card__close"
            aria-label="Skip this Auto Restock cycle"
            disabled={loading}
            onClick={() => void submitDecision("skip")}
          >
            Skip
          </button>
        ) : null}
        <div className="modal-card__copy">
          <h3>Your {pending.planName} wants to buy:</h3>
          <p>
            {pending.items.length} sold-out item types ({totalItems} units) for about{" "}
            <strong>{pending.estimatedCost}</strong>.
          </p>
        </div>

        <div className="table-list">
          {pending.items.map((item) => (
            <div key={item.id} className="table-row">
              <div className="table-row__meta">
                <strong>{item.name}</strong>
                <span className="muted">Qty {item.quantity} - {item.unitLabel}</span>
              </div>
              <strong>{item.lineTotal}</strong>
            </div>
          ))}
        </div>

        <div className="card">
          <p className="muted">
            Current balance: <strong>{pending.currentBalance}</strong>
          </p>
          <p className="muted">
            Balance after purchase: <strong>{pending.balanceAfter}</strong>
          </p>
        </div>

        {stage === "summary" ? (
          <div className="modal-card__actions">
            {pending.canSkip ? (
              <button
                type="button"
                className="ghost-button"
                disabled={loading}
                onClick={() => void submitDecision("skip")}
              >
                {busyAction === "skip" ? "Skipping..." : "No, Cancel"}
              </button>
            ) : null}
            <button type="button" disabled={loading} onClick={() => setStage("secure")}>
              Yes, Buy Now
            </button>
          </div>
        ) : (
          <>
            <div className="card">
              <p className="muted">
                Final item total: <strong>{pending.estimatedCost}</strong>
              </p>
              <p className="muted">
                Enter your secure checkout details before Auto Restock can buy anything.
              </p>
            </div>
            <label className="modal-card__field">
              Bank number
              <input
                value={bankNumber}
                onChange={(event) => setBankNumber(event.target.value)}
                type="password"
                inputMode="numeric"
                disabled={loading}
              />
            </label>
            <label className="modal-card__field">
              Checkout PIN
              <input
                value={checkoutPin}
                onChange={(event) => setCheckoutPin(event.target.value)}
                type="password"
                inputMode="numeric"
                disabled={loading}
              />
            </label>
            <label className="modal-card__field">
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                disabled={loading}
              />
            </label>
            <div className="modal-card__actions">
              {!isMax ? (
                <button
                  type="button"
                  className="ghost-button"
                  disabled={loading}
                  onClick={() => setStage("summary")}
                >
                  Back
                </button>
              ) : null}
              <button
                type="button"
                disabled={
                  loading ||
                  bankNumber.trim().length === 0 ||
                  checkoutPin.trim().length === 0 ||
                  password.trim().length === 0
                }
                onClick={() => void submitDecision("approve")}
              >
                {busyAction === "approve" ? "Buying..." : "Buy"}
              </button>
            </div>
          </>
        )}

        {error ? <p className="status-text status-text--error">{error}</p> : null}
      </div>
    </div>
  );
}
