import { BrandLogo } from "@/components/brand-logo";
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
          <div className="brand-lockup">
            <BrandLogo size={64} />
            <span className="tag">Profit Planet</span>
          </div>
          <h1>Security setup required</h1>
          <p className="muted">
            Set your checkout PIN and bank number before entering Profit Planet.
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
            <h2>PIN and bank number</h2>
            <p className="muted">
              These details are required for secure checkout and must be unique.
            </p>
            <form action="/security-setup/submit" method="post" className="stack-sm">
              <label>
                New PIN
                <HoldToShowInput
                  name="pin"
                  inputMode="numeric"
                  pattern="[0-9]{4,8}"
                  placeholder="4-8 digits"
                  required
                />
              </label>
              <label>
                Confirm PIN
                <HoldToShowInput
                  name="confirmPin"
                  inputMode="numeric"
                  pattern="[0-9]{4,8}"
                  placeholder="Repeat PIN"
                  required
                />
              </label>
              <label>
                Bank number
                <HoldToShowInput
                  name="bankNumber"
                  inputMode="numeric"
                  pattern="[0-9]{6,12}"
                  placeholder="6-12 digits"
                  required
                />
              </label>
              <label>
                Confirm bank number
                <HoldToShowInput
                  name="confirmBankNumber"
                  inputMode="numeric"
                  pattern="[0-9]{6,12}"
                  placeholder="Repeat bank number"
                  required
                />
              </label>
              <button type="submit">Save security details and unlock app</button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
