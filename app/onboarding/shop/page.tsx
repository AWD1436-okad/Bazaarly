import { redirect } from "next/navigation";

import { StatusBanner } from "@/components/status-banner";
import { requireUser } from "@/lib/auth";
import { CATEGORY_OPTIONS, SHOP_THEMES, getCategoryOptionDisplayLabel } from "@/lib/catalog";

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
  const defaultShopName = `${user.displayName}'s Shop`;

  return (
    <main className="app-shell page-grid">
      <section className="hero-card">
        <div className="stack">
          <span className="tag">Create Your Shop</span>
          <h1>Set up your shop.</h1>
          <p>Use the starter details or change them.</p>

          <StatusBanner
            tone="warning"
            title="First steps after setup"
            body="Next: list your starter stock, then shoppers can buy from you."
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
              Pick from Profit Planet&apos;s 12 supplier categories, from fruit and vegetables to
              electronics and school essentials.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <StatusBanner tone="error" title="Shop setup needs one more pass" body={error} />
      ) : null}

      <section className="card">
        <form action="/shops/create" method="post" className="stack">
          <div className="filters-grid">
            <label>
              Shop name
              <input name="name" defaultValue={defaultShopName} required />
            </label>

            <label>
              Category focus
              <select name="categoryFocus" defaultValue="">
                <option value="">Optional</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category.value} value={category.value}>
                    {getCategoryOptionDisplayLabel(category)}
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
              defaultValue="A friendly Profit Planet shop with useful deals."
              required
            />
          </label>

          <div className="section-row">
            <div>
              <strong>After this, you&apos;ll land on your seller dashboard.</strong>
              <p className="muted">
                Starter stock is ready after setup.
              </p>
            </div>
            <button type="submit">Create my shop</button>
          </div>
        </form>
      </section>
    </main>
  );
}
