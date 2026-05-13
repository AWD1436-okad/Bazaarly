import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { HoldToShowInput } from "@/components/hold-to-show-input";

type ForgotPinPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPinPage({ searchParams }: ForgotPinPageProps) {
  const params = (await searchParams) ?? {};
  const sent = params.sent === "1";
  const success = params.success === "1";
  const error = typeof params.error === "string" ? params.error : null;
  const email = typeof params.email === "string" ? params.email : "";
  const devCode =
    process.env.NODE_ENV !== "production" && typeof params.devCode === "string" ? params.devCode : null;

  return (
    <main className="auth-layout auth-layout--compact">
      <section className="auth-card auth-card--single">
        <div className="brand-lockup">
          <BrandLogo size={54} />
          <span className="tag">Profit Planet</span>
        </div>
        <div className="card reset-card">
          <span className="settings-section__eyebrow">Bank PIN Help</span>
          <h1>Reset Bank PIN</h1>
          <p className="muted">We cannot show your old PIN. Create a new one with an email code.</p>

          {sent ? (
            <div className="status-banner status-banner--success">
              <div>
                <h3>Check your email</h3>
                <p>If this account exists, we sent a PIN reset code.</p>
                {devCode ? <p className="muted">Development reset code: <strong>{devCode}</strong></p> : null}
              </div>
            </div>
          ) : null}

          {success ? (
            <div className="status-banner status-banner--success">
              <div>
                <h3>PIN reset complete</h3>
                <p>Use your new checkout PIN next time you buy.</p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="status-banner status-banner--error">
              <div>
                <h3>Try again</h3>
                <p>{error}</p>
              </div>
            </div>
          ) : null}

          {!success ? (
            <>
              <form action="/auth/pin-reset/request" method="post" className="stack-sm">
                <label>
                  Email
                  <input name="email" type="email" required autoComplete="email" defaultValue={email} />
                </label>
                <button type="submit">Send PIN code</button>
              </form>

              <form action="/auth/pin-reset/confirm" method="post" className="stack-sm">
                <label>
                  Email
                  <input name="email" type="email" required autoComplete="email" defaultValue={email} />
                </label>
                <label>
                  Reset code
                  <input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" />
                </label>
                <label>
                  New PIN
                  <HoldToShowInput name="newPin" inputMode="numeric" required autoComplete="off" />
                </label>
                <label>
                  Confirm new PIN
                  <HoldToShowInput name="confirmPin" inputMode="numeric" required autoComplete="off" />
                </label>
                <button type="submit">Reset PIN</button>
              </form>
            </>
          ) : null}

          <Link href="/settings" className="ghost-link">Back to settings</Link>
        </div>
      </section>
    </main>
  );
}
