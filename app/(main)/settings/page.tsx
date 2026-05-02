import { SettingsActions } from "@/components/settings-actions";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { getActiveCurrencyCode, getPriceProfileMetadata, getSupportedPriceProfiles } from "@/lib/price-profiles";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export default async function SettingsPage() {
  const user = await requireUser();
  const currencyCode = await getActiveCurrencyCode(user.id);
  const profile = getPriceProfileMetadata(currencyCode);

  return (
    <div className="page-grid">
      <section className="page-header">
        <h1>Settings</h1>
        <p>Manage your account and seller identity from one place.</p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <span className="metric-card__eyebrow">Account</span>
          <strong>{user.displayName}</strong>
          <p className="muted">@{user.username}</p>
        </article>
        <article className="metric-card">
          <span className="metric-card__eyebrow">Balance</span>
          <strong>{formatCurrency(user.balance, currencyCode)}</strong>
          <p className="muted">Store rename cost: {formatCurrency(20000, currencyCode)}</p>
        </article>
        <article className="metric-card">
          <span className="metric-card__eyebrow">Display currency</span>
          <strong>{profile.currencyCode}</strong>
          <p className="muted">{profile.label}</p>
        </article>
        <article className="metric-card">
          <span className="metric-card__eyebrow">Store</span>
          <strong>{user.shop?.name ?? "No shop yet"}</strong>
          <p className="muted">{user.shop ? "Active seller profile" : "Create a shop first"}</p>
        </article>
      </section>

      <SettingsActions
        username={user.username}
        displayName={user.displayName}
        currentShopName={user.shop?.name ?? null}
        canRenameStore={Boolean(user.shop)}
        currentCurrencyCode={currencyCode}
        priceProfiles={getSupportedPriceProfiles()}
        maskedBankNumber={user.bankNumberLast4 ? `****${user.bankNumberLast4}` : "Not recoverable"}
        renameStoreCostLabel={formatCurrency(20000, currencyCode)}
        autoRestockEnabled={user.autoRestockEnabled}
        autoRestockQuantity={Math.min(5, Math.max(1, user.autoRestockQuantity))}
        autoRestockLastRunAt={user.autoRestockLastRunAt?.toISOString() ?? null}
      />

    </div>
  );
}
