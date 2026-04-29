import { redirect } from "next/navigation";

import { StatusBanner } from "@/components/status-banner";
import { requireUser } from "@/lib/auth";
import { CATEGORY_OPTIONS, SHOP_THEMES } from "@/lib/catalog";

type OnboardingProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShopOnboardingPage({ searchParams }: OnboardingProps) {
  const user = await requireUser();

  if (user.shop) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="app-shell page-grid">
      <section className="hero-card">
        <div className="stack">
          <span className="tag">Create Your Shop</span>
          <h1>Set up your place in Tradex.</h1>
          <p>
            Every player gets one shop in the same shared world. Pick a strong name,
            write a short description, choose your focus, and we will send you
            straight to the seller dashboard.
          </p>

          <StatusBanner
            tone="warning"
            title="First steps after setup"
            body="1. Review your starter stock. 2. Create your first listing. 3. Your shop goes live for the whole server."
          />
        </div>

        <div className="hero-card__aside">
          <div className="hero-card__panel">
            <strong>{user.displayName}</strong>
            <p className="muted">
              New shops start with guided onboarding, starter inventory, and a working
              budget so you can list quickly.
            </p>
          </div>
          <div className="hero-card__panel">
            <strong>Allowed categories</strong>
            <p className="muted">
              Pick from Tradex&apos;s 12 supplier categories, from fruit and vegetables to
              electronics and school essentials.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <StatusBanner tone="error" title="Shop setup needs one more pass" body={error} />
      ) : null}

      <section className="card">
        <div className="section-row">
          <div>
            <strong>Choose how to enter Tradex</strong>
            <p className="muted">Create your own shop here, or request to join an existing shop as a branch.</p>
          </div>
          <a href="/branch/join" className="ghost-button">
            Join as Branch
          </a>
        </div>
        <form action="/shops/create" method="post" className="stack">
          <div className="filters-grid">
            <label>
              Shop name
              <input name="name" placeholder="Sunny Basket" required />
            </label>

            <label>
              Category focus
              <select name="categoryFocus" defaultValue="">
                <option value="">Optional</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Theme
              <select name="accentColor" defaultValue={SHOP_THEMES[0].value}>
                {SHOP_THEMES.map((theme) => (
                  <option key={theme.value} value={theme.value}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Shop description
            <textarea
              name="description"
              placeholder="Tell shoppers what your store is best at."
              required
            />
          </label>

          <div className="section-row">
            <div>
              <strong>After this, you&apos;ll land on your seller dashboard.</strong>
              <p className="muted">
                We&apos;ll start you with inventory so you can list straight away.
              </p>
            </div>
            <button type="submit">Create my shop</button>
          </div>
        </form>
      </section>
    </main>
  );
}
