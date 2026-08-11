import { HoldToShowInput } from "@/components/hold-to-show-input";
import { SecuritySetupResultPanel } from "@/components/security-setup-result-panel";
import type { Route } from "next";

type SecuritySetupLockProps = {
  error?: string | null;
  completedBankNumber?: string | null;
  continueHref?: Route;
};

export function SecuritySetupLock({
  error,
  completedBankNumber,
  continueHref = "/dashboard",
}: SecuritySetupLockProps) {
  return (
    <section className="auth-card auth-card--single">
      <div className="stack">
        <div>
          <h1>Set up your trading number</h1>
          <p className="muted">
            Pick a six-digit in-game bank number. This is only for Profit Planet, not a real bank account.
          </p>
        </div>

        {error ? (
          <div className="status-banner status-banner--error">
            <div>
              <h3>Security setup blocked</h3>
              <p>{error}</p>
            </div>
          </div>
        ) : null}

        {completedBankNumber ? (
          <SecuritySetupResultPanel bankNumber={completedBankNumber} continueHref={continueHref} />
        ) : (
          <div className="card">
            <h2>In-game bank number</h2>
            <p className="muted">
              You will use this number to confirm purchases. Keep it somewhere safe.
            </p>
            <form action="/security-setup/submit" method="post" className="stack-sm">
              <label>
                Bank number
                <HoldToShowInput
                  name="bankNumber"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  placeholder="6 digits"
                  required
                />
              </label>
              <label>
                Confirm bank number
                <HoldToShowInput
                  name="confirmBankNumber"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  placeholder="Repeat bank number"
                  required
                />
              </label>
              <button type="submit">Save bank number</button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
