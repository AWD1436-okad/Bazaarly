"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { HoldToShowInput } from "@/components/hold-to-show-input";

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

type CycleResult = {
  status?: string;
  message?: string;
  itemCount?: number;
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
  const lastCycleStatusRef = useRef<string | null>(null);

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
        const response = await fetch("/api/auto-restock/pending", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const payload = (await response.json()) as {
          pending?: PendingRestock | null;
          cycleResult?: CycleResult;
        };
        if (!active) return;
        const nextPending = payload.pending ?? null;
        setPending(nextPending);
        if (!nextPending) {
          setStage("summary");
          setPassword("");
          setCheckoutPin("");
          setBankNumber("");
          setError(null);
          if (
            payload.cycleResult?.message &&
            payload.cycleResult.status &&
            payload.cycleResult.status !== "not_due" &&
            payload.cycleResult.status !== "pending_exists" &&
            payload.cycleResult.status !== lastCycleStatusRef.current
          ) {
            lastCycleStatusRef.current = payload.cycleResult.status;
            setSuccessMessage(payload.cycleResult.message);
            window.setTimeout(() => setSuccessMessage(null), 4500);
          }
          if (
            payload.cycleResult?.status === "full_access_completed" ||
            payload.cycleResult?.status === "subscription_cancelled"
          ) {
            router.refresh();
          }
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
  }, [router]);

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
            Close
          </button>
        ) : null}
        {stage === "summary" ? (
          <>
            <div className="modal-card__copy">
              <h3>Your Restocker wants to buy:</h3>
              <p>
                {pending.planName} found {pending.items.length} sold-out item types ({totalItems} units)
                for about <strong>{pending.estimatedCost}</strong>.
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
                Total price: <strong>{pending.estimatedCost}</strong>
              </p>
              <p className="muted">
                Current balance: <strong>{pending.currentBalance}</strong>
              </p>
              <p className="muted">
                Balance after purchase: <strong>{pending.balanceAfter}</strong>
              </p>
            </div>

            <div className="modal-card__actions">
              {pending.canSkip ? (
                <button
                  type="button"
                  className="ghost-button"
                  disabled={loading}
                  onClick={() => void submitDecision("skip")}
                >
                  {busyAction === "skip" ? "Skipping..." : "No"}
                </button>
              ) : null}
              <button type="button" disabled={loading} onClick={() => setStage("secure")}>
                Yes
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-card__copy">
              <h3>Confirm Restock</h3>
              <p>Enter your secure checkout details before Auto Restock can buy anything.</p>
            </div>
            <div className="card">
              <p className="muted">
                Total restock price: <strong>{pending.estimatedCost}</strong>
              </p>
              <p className="muted">
                Current balance: <strong>{pending.currentBalance}</strong>
              </p>
              <p className="muted">
                Balance after purchase: <strong>{pending.balanceAfter}</strong>
              </p>
            </div>
            <label className="modal-card__field">
              Bank number
              <HoldToShowInput
                value={bankNumber}
                onChange={(event) => setBankNumber(event.target.value)}
                inputMode="numeric"
                disabled={loading}
                autoComplete="off"
              />
            </label>
            <label className="modal-card__field">
              Checkout PIN
              <HoldToShowInput
                value={checkoutPin}
                onChange={(event) => setCheckoutPin(event.target.value)}
                inputMode="numeric"
                disabled={loading}
                autoComplete="off"
              />
            </label>
            <label className="modal-card__field">
              Password
              <HoldToShowInput
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                autoComplete="current-password"
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
                {busyAction === "approve" ? "Restocking..." : "Confirm Restock"}
              </button>
            </div>
          </>
        )}

        {error ? <p className="status-text status-text--error">{error}</p> : null}
      </div>
    </div>
  );
}
