import { SettingsActions } from "@/components/settings-actions";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export default async function SettingsPage() {
  const user = await requireUser();

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
          <strong>{formatCurrency(user.balance)}</strong>
          <p className="muted">Store rename cost: $200.00</p>
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
      />
    </div>
  );
}
