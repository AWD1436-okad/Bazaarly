import { redirect } from "next/navigation";

import { HoldToShowInput } from "@/components/hold-to-show-input";
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
            <span className="tag">Profit Planet</span>
            <h1>Start trading.</h1>
            <p className="muted auth-hero-lead">Enter your shop name and password to continue or start a new shop.</p>
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
            <form action="/auth/enter" method="post" className="stack-sm">
              <label>
                Shop name
                <input name="shopName" placeholder="My Shop" minLength={3} maxLength={40} required autoComplete="username" />
              </label>
              <label>
                Shop password
                <HoldToShowInput name="password" placeholder="At least 8 characters" minLength={8} required autoComplete="current-password" />
              </label>
              <button type="submit">Start Trading</button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
