import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const NOTIFICATIONS_PAGE_SIZE = 20;

type NotificationsPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

function buildNotificationsHref(page: number) {
  return page <= 1 ? "/notifications" : `/notifications?page=${page}`;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const user = await requireUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawPage = Number(resolvedSearchParams?.page ?? "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const skip = (page - 1) * NOTIFICATIONS_PAGE_SIZE;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      type: true,
      message: true,
      read: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: NOTIFICATIONS_PAGE_SIZE + 1,
  });
  const visibleNotifications = notifications.slice(0, NOTIFICATIONS_PAGE_SIZE);
  const hasNextPage = notifications.length > NOTIFICATIONS_PAGE_SIZE;
  const hasPreviousPage = page > 1;

  return (
    <div className="page-grid">
      <section className="page-header">
        <h1>Notifications</h1>
        <p>Sales, low-stock warnings, and important market updates all show up here.</p>
      </section>

      <section className="card">
        <div className="section-row">
          <div>
            <h2>Notification center</h2>
            <p>Unread items stay highlighted until you mark them read.</p>
          </div>
          <form action="/notifications/read-all" method="post">
            <button type="submit">Mark all as read</button>
          </form>
        </div>

        <div className="table-list">
          {visibleNotifications.length === 0 ? (
            <article className="notification-row">
              <strong>No notifications yet</strong>
              <p className="muted">New sales, low-stock warnings, and market updates will show up here.</p>
            </article>
          ) : (
            visibleNotifications.map((notification) => (
              <article
                key={notification.id}
                className={`notification-row ${notification.read ? "" : "unread"}`}
              >
                <strong>{notification.type.replace("_", " ")}</strong>
                <p className="muted">{notification.message}</p>
                <span className="muted">{notification.createdAt.toLocaleString()}</span>
              </article>
            ))
          )}
        </div>

        {(hasPreviousPage || hasNextPage) && (
          <div className="section-row">
            <p className="muted">
              Showing page {page}
              {hasNextPage ? " with more history available." : "."}
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              {hasPreviousPage ? <a href={buildNotificationsHref(page - 1)}>Previous</a> : <span />}
              {hasNextPage ? <a href={buildNotificationsHref(page + 1)}>Next</a> : <span />}
            </div>
          </div>
        )}
        {!hasNextPage && page === 1 && visibleNotifications.length > 0 ? (
          <p className="muted">Only the most recent notification history is loaded here because your current inbox fits on one page.</p>
        ) : null}
        {hasNextPage ? (
          <p className="muted">Older notifications load page by page so the inbox stays fast as your history grows.</p>
        ) : null}
      </section>
    </div>
  );
}
