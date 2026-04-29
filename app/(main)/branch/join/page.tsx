import { redirect } from "next/navigation";

import { StatusBanner } from "@/components/status-banner";
import { expireOldBranchRequests, fuzzyShopMatchScore } from "@/lib/branching";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type BranchJoinPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BranchJoinPage({ searchParams }: BranchJoinPageProps) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const error = typeof params.error === "string" ? params.error : null;
  const requested = params.requested === "1";

  if (user.shop) {
    redirect("/dashboard");
  }

  await expireOldBranchRequests();

  const [requests, branchableShops] = await Promise.all([
    prisma.branchRequest.findMany({
      where: {
        requesterId: user.id,
        status: { in: ["PENDING", "APPROVED"] },
      },
      include: {
        parentShop: {
          select: {
            id: true,
            name: true,
            branchLocation: true,
            rating: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shop.findMany({
      where: {
        availableToBranch: true,
        status: "ACTIVE",
        ownerId: { not: user.id },
      },
      select: {
        id: true,
        name: true,
        description: true,
        branchLocation: true,
        rating: true,
        totalSales: true,
      },
      take: 60,
    }),
  ]);

  const approvedRequest = requests.find((request) => request.status === "APPROVED" && !request.requesterShopId);
  const pendingRequests = requests.filter((request) => request.status === "PENDING");
  const searchResults = branchableShops
    .map((shop) => ({
      ...shop,
      score: fuzzyShopMatchScore(query, shop.name),
    }))
    .filter((shop) => !query || shop.score > 0)
    .sort((left, right) => right.score - left.score || right.rating - left.rating)
    .slice(0, 12);

  return (
    <div className="page-grid">
      <section className="page-header">
        <span className="tag">Join as Branch</span>
        <h1>Open a branch of an existing shop.</h1>
        <p>Search shops that allow branches, send a request, then finish setup after the owner approves.</p>
      </section>

      {error ? <StatusBanner tone="error" title="Branch setup blocked" body={error} /> : null}
      {requested ? <StatusBanner tone="success" title="Branch request sent" body="The shop owner has 48 hours to approve or reject it." /> : null}

      {approvedRequest ? (
        <section className="card">
          <div className="card-header">
            <div className="card-header__copy">
              <h2>Approved setup</h2>
              <p>{approvedRequest.parentShop.name} approved your request. Enter your real suburb to create the branch.</p>
            </div>
          </div>
          <form action="/branch/setup" method="post" className="inline-form">
            <input type="hidden" name="requestId" value={approvedRequest.id} />
            <label>
              Branch suburb/location
              <input name="location" placeholder="Lakemba, NSW" required />
            </label>
            <button type="submit">Create branch shop</button>
          </form>
        </section>
      ) : null}

      {pendingRequests.length > 0 ? (
        <section className="card">
          <h2>Pending requests</h2>
          <div className="table-list">
            {pendingRequests.map((request) => (
              <div key={request.id} className="table-row">
                <div className="table-row__meta">
                  <strong>{request.parentShop.name}</strong>
                  <span className="muted">
                    Waiting for owner response. Expires {request.expiresAt.toLocaleString()}.
                  </span>
                </div>
                <span className="category-chip">Pending</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card">
        <div className="card-header">
          <div className="card-header__copy">
            <h2>Find a branchable shop</h2>
            <p>Search is typo-tolerant, so close matches like Fresh Shop can still find Fresh Mart.</p>
          </div>
        </div>
        <form action="/branch/join" className="inline-form">
          <label>
            Shop search
            <input name="q" defaultValue={query} placeholder="Fresh Shop" />
          </label>
          <button type="submit">Search</button>
        </form>
      </section>

      <section className="listing-grid listing-grid--list">
        {searchResults.length === 0 ? (
          <div className="empty-state">No branchable shops match that search yet.</div>
        ) : (
          searchResults.map((shop) => (
            <article key={shop.id} className="card listing-card">
              <div className="listing-card__header">
                <div>
                  <h3>{shop.name}</h3>
                  <p className="muted">{shop.description}</p>
                </div>
                <div className="listing-card__price">
                  <strong>Rated {shop.rating.toFixed(1)}</strong>
                  <span>{shop.totalSales} sales</span>
                </div>
              </div>
              <p className="muted">Branch base: {shop.branchLocation ?? "Location verified"}</p>
              <form action="/branch/request" method="post" className="stack-sm">
                <input type="hidden" name="parentShopId" value={shop.id} />
                <label>
                  Your suburb/location
                  <input name="location" placeholder="Auburn, NSW" required />
                </label>
                <label>
                  Message
                  <input name="message" placeholder="I want to open a local branch." />
                </label>
                <button type="submit">Send branch request</button>
              </form>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
