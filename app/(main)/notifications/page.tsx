import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

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
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`notification-row ${notification.read ? "" : "unread"}`}
            >
              <strong>{notification.type.replace("_", " ")}</strong>
              <p className="muted">{notification.message}</p>
              <span className="muted">{notification.createdAt.toLocaleString()}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
