import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";

type ForgotPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const GENERIC_RESET_MESSAGE = "If this account exists, reset instructions have been created.";

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const sent = params.sent === "1";
  const blocked = params.blocked === "1";
  const devResetUrl = process.env.NODE_ENV !== "production" && typeof params.devResetUrl === "string"
    ? params.devResetUrl
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
          <p className="muted">
            Enter your username or email. For safety, we always show the same response.
          </p>

          {sent ? (
            <div className="status-banner status-banner--success">
              <div>
                <h3>Reset request received</h3>
                <p>{GENERIC_RESET_MESSAGE}</p>
                {devResetUrl ? (
                  <p className="muted">
                    Development reset link: <a href={devResetUrl}>Open reset page</a>
                  </p>
                ) : null}
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
              Username or email
              <input name="usernameOrEmail" required autoComplete="username" />
            </label>
            <button type="submit">Create reset instructions</button>
          </form>

          <Link href="/login" className="ghost-link">
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
