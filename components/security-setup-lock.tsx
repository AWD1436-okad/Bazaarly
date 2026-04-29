import { BrandLogo } from "@/components/brand-logo";

type SecuritySetupLockProps = {
  error?: string | null;
  intent?: "shop" | "branch";
};

export function SecuritySetupLock({ error, intent = "shop" }: SecuritySetupLockProps) {
  const formAction =
    intent === "branch" ? "/security-setup/submit?intent=branch" : "/security-setup/submit";

  return (
    <section className="auth-card auth-card--single">
      <div className="stack">
        <div>
          <div className="brand-lockup">
            <BrandLogo size={64} />
            <span className="tag">Tradex</span>
          </div>
          <h1>Security setup required</h1>
          <p className="muted">
            Set your checkout PIN and bank number before entering Tradex.
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

        <div className="card">
          <h2>PIN and bank number</h2>
          <p className="muted">
            These details are required for secure checkout and must be unique.
          </p>
          <form action={formAction} method="post" className="stack-sm">
            <input type="hidden" name="intent" value={intent} />
            <label>
              New PIN
              <input
                name="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4,8}"
                placeholder="4-8 digits"
                required
              />
            </label>
            <label>
              Confirm PIN
              <input
                name="confirmPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4,8}"
                placeholder="Repeat PIN"
                required
              />
            </label>
            <label>
              Bank number
              <input
                name="bankNumber"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6,12}"
                placeholder="6-12 digits"
                required
              />
            </label>
            <label>
              Confirm bank number
              <input
                name="confirmBankNumber"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6,12}"
                placeholder="Repeat bank number"
                required
              />
            </label>
            <button type="submit">Save security details and unlock app</button>
          </form>
        </div>
      </div>
    </section>
  );
}
