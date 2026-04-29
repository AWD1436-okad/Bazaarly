import { SettingsActions } from "@/components/settings-actions";
import { requireUser } from "@/lib/auth";
import { BRANCH_SETUP_COST_CENTS, expireOldBranchRequests } from "@/lib/branching";
import { formatCurrency } from "@/lib/money";
import { getActiveCurrencyCode, getPriceProfileMetadata, getSupportedPriceProfiles } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export default async function SettingsPage() {
  const user = await requireUser();
  const currencyCode = await getActiveCurrencyCode(user.id);
  const profile = getPriceProfileMetadata(currencyCode);
  await expireOldBranchRequests();
  const branchRequests = user.shop
    ? await prisma.branchRequest.findMany({
        where: {
          parentShopId: user.shop.id,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        include: {
          requester: {
            select: {
              displayName: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

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
      />

      {user.shop ? (
        <section className="card settings-card">
          <div className="card-header">
            <div className="card-header__copy">
              <h2>Branch Availability</h2>
              <p>
                Let other players request to open branches of your shop. Enabling requires a real
                suburb/location and costs {formatCurrency(BRANCH_SETUP_COST_CENTS, currencyCode)}.
              </p>
            </div>
            <span className="category-chip">
              {user.shop.availableToBranch ? "Available to be Branched" : "Branching off"}
            </span>
          </div>
          <form action="/settings/branch-availability" method="post" className="inline-form">
            <input type="hidden" name="action" value="enable" />
            <label>
              Real suburb/location
              <input
                name="location"
                placeholder="Parramatta, NSW"
                defaultValue={user.shop.branchLocation ?? ""}
                required
              />
            </label>
            <button type="submit">
              {user.shop.availableToBranch ? "Update Branch Location" : "Enable Branching"}
            </button>
          </form>
          {user.shop.availableToBranch ? (
            <form action="/settings/branch-availability" method="post">
              <input type="hidden" name="action" value="disable" />
              <button type="submit" className="ghost-button">
                Turn off branching
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      {user.shop ? (
        <section className="card settings-card">
          <div className="card-header">
            <div className="card-header__copy">
              <h2>Branch Requests</h2>
              <p>Approve or reject branch requests before they expire after 48 hours.</p>
            </div>
          </div>
          {branchRequests.length === 0 ? (
            <div className="empty-state">No pending branch requests.</div>
          ) : (
            <div className="table-list">
              {branchRequests.map((request) => (
                <div key={request.id} className="table-row">
                  <div className="table-row__meta">
                    <strong>{request.requester.displayName}</strong>
                    <span className="muted">
                      @{request.requester.username} wants a branch in{" "}
                      {request.requestedLocation ?? "their suburb"}. Expires{" "}
                      {request.expiresAt.toLocaleString()}.
                    </span>
                  </div>
                  <div className="table-row__actions">
                    <form action="/branch/respond" method="post">
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="action" value="approve" />
                      <button type="submit">Approve</button>
                    </form>
                    <form action="/branch/respond" method="post">
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="action" value="reject" />
                      <button type="submit" className="ghost-button">
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
