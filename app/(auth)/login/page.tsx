import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();

  if (user) {
    if (!hasCompletedSecuritySetup(user)) {
      redirect("/security-setup");
    }
    redirect(user.shop ? "/dashboard" : "/onboarding/shop");
  }

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;

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
              Build a shop, buy stock, set prices, and turn smart trades into real profit.
            </p>
          </div>

          <div className="auth-game-panel">
            <span className="tag">Marketplace game loop</span>
            <div className="auth-game-panel__steps">
              <span>Buy stock</span>
              <span>List products</span>
              <span>Make sales</span>
              <span>Manage profit</span>
              <span>Complete challenges</span>
            </div>
            <p>
              Every choice matters: overspend and profit drops, price too high and shoppers slow down,
              keep stock moving and your shop grows.
            </p>
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
              Continue running your shop and checking live sales.
            </p>
            <form action="/auth/login" method="post" className="stack-sm">
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
              Start with secure PIN setup, then create your shop and begin trading.
            </p>
            <form action="/auth/register" method="post" className="stack-sm">
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
