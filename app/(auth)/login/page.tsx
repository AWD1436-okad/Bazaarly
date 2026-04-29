import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();

  if (user) {
    const params = (await searchParams) ?? {};
    const onboardingIntent = params.intent === "branch" ? "branch" : "shop";

    if (!hasCompletedSecuritySetup(user)) {
      redirect(onboardingIntent === "branch" ? "/security-setup?intent=branch" : "/security-setup");
    }
    redirect(user.shop ? "/dashboard" : onboardingIntent === "branch" ? "/branch/join" : "/onboarding/shop");
  }

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;
  const onboardingIntent = params.intent === "branch" ? "branch" : "shop";

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <div className="stack">
          <div>
            <div className="brand-lockup">
              <BrandLogo size={64} />
              <span className="tag">Tradex</span>
            </div>
            <h1>Enter the global marketplace.</h1>
            <p className="muted">
              Sign in with your own account or create a new player and open a shop in the
              shared world.
            </p>
            <div className="inline-actions">
              <a
                href="/login?intent=shop"
                className={onboardingIntent === "shop" ? "category-chip" : "ghost-button"}
              >
                New Shop
              </a>
              <a
                href="/login?intent=branch"
                className={onboardingIntent === "branch" ? "category-chip" : "ghost-button"}
              >
                Join as Branch
              </a>
            </div>
          </div>

          {error ? (
            <div className="status-banner status-banner--error">
              <div>
                <h3>Something needs attention</h3>
                <p>{error}</p>
              </div>
            </div>
          ) : null}

          <div className="card">
            <h2>Secure login</h2>
            <p className="muted">
              Use your username or email together with your password.
            </p>
            <form action="/auth/login" method="post" className="stack-sm">
              <input type="hidden" name="intent" value={onboardingIntent} />
              <label>
                Username or email
                <input name="username" placeholder="your username or email" required />
              </label>
              <label>
                Password
                <input name="password" type="password" placeholder="Your password" required />
              </label>
              <button type="submit">Log in</button>
            </form>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h2>Create a new player</h2>
            <p className="muted">
              New accounts start with PIN setup, then shop setup, so checkout is protected.
            </p>
            <form action="/auth/register" method="post" className="stack-sm">
              <input type="hidden" name="intent" value={onboardingIntent} />
              <label>
                Display name
                <input name="displayName" placeholder="Taylor" required />
              </label>
              <label>
                Username
                <input name="username" placeholder="taylor" required />
              </label>
              <label>
                Email
                <input name="email" type="email" placeholder="taylor@example.com" required />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
              </label>
              <button type="submit">Create account</button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
