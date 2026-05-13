import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { HoldToShowInput } from "@/components/hold-to-show-input";

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const email = typeof params.email === "string" ? params.email : "";
  const error = typeof params.error === "string" ? params.error : null;
  const success = params.success === "1";

  return (
    <main className="auth-layout auth-layout--compact">
      <section className="auth-card auth-card--single">
        <div className="brand-lockup">
          <BrandLogo size={54} />
          <span className="tag">Profit Planet</span>
        </div>
        <div className="card reset-card">
          <span className="settings-section__eyebrow">Secure Reset</span>
          <h1>Choose a new password</h1>
          <p className="muted">
            We cannot show your old password. Create a new one and use it for your next login.
          </p>

          {success ? (
            <div className="status-banner status-banner--success">
              <div>
                <h3>Password reset complete</h3>
                <p>Your old sessions were signed out. You can now log in with your new password.</p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="status-banner status-banner--error">
              <div>
                <h3>Reset failed</h3>
                <p>{error}</p>
              </div>
            </div>
          ) : null}

          {!success ? (
            <form action="/auth/password-reset/confirm" method="post" className="stack-sm">
              <label>
                Email
                <input name="email" type="email" required autoComplete="email" defaultValue={email} />
              </label>
              <label>
                Reset code
                <input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" />
              </label>
              <label>
                New password
                <HoldToShowInput
                  name="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
              </label>
              <label>
                Confirm new password
                <HoldToShowInput
                  name="confirmPassword"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                />
              </label>
              <button type="submit">Reset password</button>
            </form>
          ) : null}

          <Link href="/login" className="ghost-link">
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
