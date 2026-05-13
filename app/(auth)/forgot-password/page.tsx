import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";

type ForgotPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const GENERIC_RESET_MESSAGE = "If this account exists, we sent a reset code.";

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const sent = params.sent === "1";
  const blocked = params.blocked === "1";
  const devCode = process.env.NODE_ENV !== "production" && typeof params.devCode === "string"
    ? params.devCode
    : null;

  return (
    <main className="auth-layout auth-layout--compact">
      <section className="auth-card auth-card--single">
        <div className="brand-lockup">
          <BrandLogo size={54} />
          <span className="tag">Profit Planet</span>
        </div>
        <div className="card reset-card">
          <span className="settings-section__eyebrow">Account Recovery</span>
          <h1>Reset Password</h1>
          <p className="muted">Enter your email and check for a code.</p>

          {sent ? (
            <div className="status-banner status-banner--success">
              <div>
                <h3>Reset request received</h3>
                <p>{GENERIC_RESET_MESSAGE}</p>
                {devCode ? (
                  <p className="muted">
                    Development reset code: <strong>{devCode}</strong>
                  </p>
                ) : null}
                <Link href="/reset-password" className="ghost-button">Enter reset code</Link>
              </div>
            </div>
          ) : null}

          {blocked ? (
            <div className="status-banner status-banner--error">
              <div>
                <h3>Too many attempts</h3>
                <p>Please wait a few minutes before requesting another reset.</p>
              </div>
            </div>
          ) : null}

          <form action="/auth/password-reset/request" method="post" className="stack-sm">
            <label>
              Email
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <button type="submit">Send reset code</button>
          </form>

          <Link href="/login" className="ghost-link">
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
