import Image from "next/image";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { HoldToShowInput } from "@/components/hold-to-show-input";
import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { PLAYER_MODE_OPTIONS } from "@/lib/player-mode";

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
              <BrandLogo size={58} />
              <span className="tag">Profit Planet</span>
            </div>
            <Image
              src="/profit-planet-logo.png"
              alt="Profit Planet"
              width={1254}
              height={1254}
              className="auth-final-logo"
              priority
            />
            <h1>Grow your profit planet.</h1>
            <p className="muted auth-hero-lead">
              Start as a street seller, buy your first stock, make sales, unlock levels, and race other shops to
              become a Business Tycoon.
            </p>
          </div>

          <div className="auth-game-panel">
            <div className="auth-planet-preview" aria-hidden="true">
              <span>PP</span>
              <i />
              <i />
            </div>
            <span className="tag">First 5 minutes</span>
            <div className="auth-game-panel__steps">
              <span>1. Buy stock</span>
              <span>2. List it</span>
              <span>3. Make profit</span>
              <span>4. Claim rewards</span>
            </div>
            <div className="auth-xp-preview">
              <strong>Level 1: Street Seller</strong>
              <div className="challenge-progress" aria-hidden="true">
                <span style={{ width: "38%" }} />
              </div>
              <small>XP, daily goals, bot shoppers, and live market events keep the world moving.</small>
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
            <form action="/auth/login" method="post" className="stack-sm">
              <label>
                Email
                <input name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
              </label>
              <label>
                Password
                <HoldToShowInput name="password" placeholder="Your password" required autoComplete="current-password" />
              </label>
              <button type="submit">Log in</button>
            </form>
            <p className="auth-card__helper">
              <a href="/forgot-password">Forgot password?</a>
            </p>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h2>Start trading</h2>
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
                <HoldToShowInput
                  name="password"
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </label>
              <fieldset className="player-mode-picker">
                <legend>Choose your player mode</legend>
                <div className="player-mode-picker__grid">
                  {PLAYER_MODE_OPTIONS.map((mode) => (
                    <label key={mode.value} className="player-mode-option">
                      <input
                        type="radio"
                        name="playerMode"
                        value={mode.value}
                        defaultChecked={mode.value === "YOUNG"}
                      />
                      <span className="player-mode-option__icon" aria-hidden="true">
                        {mode.value === "LITTLE"
                          ? "1"
                          : mode.value === "JUNIOR"
                            ? "2"
                            : mode.value === "YOUNG"
                              ? "3"
                              : "4"}
                      </span>
                      <span>
                        <strong>{mode.label}</strong>
                        <small>{mode.signupDescription}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="submit">Start Trading</button>
            </form>
          </div>
          <div className="auth-win-card">
            <span className="tag">Win goals</span>
            <strong>Reach the profit target</strong>
            <span>Unlock Planet Tycoon, beat daily goals, and climb the shop leaderboard.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
